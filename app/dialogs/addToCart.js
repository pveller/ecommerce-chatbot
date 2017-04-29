const builder = require('botbuilder');
const search = require('../search/search');
const recommendations = require('../recommendations');
const sentiment = require('../sentiment');

const lookupProductOrVariant = function (session, id, next) {
    session.sendTyping();

    return Promise.all([
        search.findProductById(id),
        search.findVariantById(id)
    ]).then(([products, variants]) => {
        if (products.length) {
            product = products[0];
            if (product.modifiers.length === 0 || (product.size.length <= 1 && product.color.length <= 1)) {
                session.sendTyping();

                session.privateConversationData = Object.assign({}, session.privateConversationData, { product });
                session.save();

                return search.findVariantForProduct(product.id);
            } else {
                session.reset('/showProduct', {
                    entities: [{
                        entity: id,
                        score: 1,
                        type: 'Product'
                    }]
                });
                return Promise.reject();
            }
        } else if (variants.length) {
            return variants[0];
        } else {
            session.endDialog(`I cannot find ${id} in my product catalog, sorry!`);
            return Promise.reject();
        }
    });
};

const describe = function (product, variant) {
    return `${product.title} (${variant.sku})` +
        (!!variant.color ? `, Color - ${variant.color}` : '') +
        (!!variant.size ? `, Size - ${variant.size}` : '');
};


const showRecommendations = function (session) {
    session.sendTyping();

    Promise.all(session.dialogData.recommendations.map(r => {
        return new Promise((resolve, reject) => {
            search.findVariantBySku(r.items[0].id).then((variants) => {
                r.variant = variants[0];
                resolve(r);
            });
        });
    })).then((expanded) => {
        session.sendTyping();

        const tiles = expanded.map(e => new builder.ThumbnailCard(session)
            .title(e.items[0].name)
            .subtitle(`$${e.variant.price}`)
            .text(e.reasoning)
            .buttons([builder.CardAction.postBack(session, `@add:${e.variant.id}`, 'Add To Cart')])
            .images([
                builder.CardImage.create(session, `https://${e.variant.image_domain}${e.variant.image_suffix}`)
            ])
        );

        session.endDialog(new builder.Message(session)
            .attachments(tiles)
            .attachmentLayout(builder.AttachmentLayout.carousel));
    });
}


module.exports = function (bot) {
    bot.dialog('/addToCart', [
        function (session, args, next) {
            if (!args) {
                return session.reset('/confused');
            }

            const id = builder.EntityRecognizer.findEntity(args.entities, 'Id');
            if (!id || !id.entity) {
                return session.reset('/confused');
            }

            const product = session.privateConversationData.product;
            const variant = session.privateConversationData.variant;

            if (!variant || variant.id !== id.entity) {
                lookupProductOrVariant(session, id.entity, next)
                    .then((variant) => {
                        session.privateConversationData = Object.assign({}, session.privateConversationData, {
                            variant: variant || product // workaroudn for products without variants
                        });
                        session.save();

                        next();
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            } else {
                next();
            }
        },
        function (session, args, next) {
            const product = session.privateConversationData.product;
            const variant = session.privateConversationData.variant;

            session.sendTyping();
            session.privateConversationData = Object.assign({}, session.privateConversationData, {
                // save the product instead of its variant for no-variants products
                cart: (session.privateConversationData.cart || []).concat({ product, variant })
            });
            session.save();

            session.send(`I have added ${describe(product, variant)} to your cart`);

            next({ variant });
        },
        function (session, args, next) {
            session.sendTyping();

            recommendations
                .recommend([args.variant.sku])
                .then((variants) => {
                    session.sendTyping();

                    if (!variants.length) {
                        session.reset('/showCart');
                    } else {
                        session.dialogData = Object.assign({}, session.dialogData, {
                            recommendations: variants
                        });
                        session.save();

                        next();
                    }
                });
        },
        ...sentiment.confirm('I also have a few recommendations for you, would you like to see them?'),
        function (session, args, next) {
            if (!args.response) {
                session.endDialog('Alright. Let me know if I can help you find anything else or if you would like to see your shopping cart.');
            } else {
                showRecommendations(session);
            }
        }
    ]);
};