const builder = require('botbuilder');
const search = require('../search/search');

const showProduct = function (session, product) {
    session.sendTyping();

    const tile = new builder.HeroCard(session)
        .title(product.title)
        .subtitle(`$${product.price}`)
        .text(product.description)
        .buttons(product.modifiers.length === 0 || (product.size.length <= 1 && product.color.length <= 1)
            ? [builder.CardAction.postBack(session, `/add:${product.id}`, 'Add To Cart')]
            : [])
        .images([
            builder.CardImage.create(session, `https://${product.image_domain}${product.image_suffix}`)
        ]);

    session.send(new builder.Message(session).attachments([tile]));
};

module.exports = function (bot) {
    bot.dialog('/showProduct', [
        function (session, args, next) {
            if (!args) {
                return session.reset('/confused');
            }

            const product = builder.EntityRecognizer.findEntity(args.entities, 'Product')

            if (!product || !product.entity) {
                builder.Prompts.text(session, 'I am sorry, what product would you like to see?');
            } else {
                next({ response: product.entity });
            }
        },
        function (session, args, next) {
            session.sendTyping();

            const product = args.response;

            Promise.all([
                search.findProductById(product),
                search.findProductsByTitle(product)
            ]).then(([product, products]) => {
                const item = product.concat(products)[0];
                if (!item) {
                    // ToDo: clean the "context" product
                    session.endDialog('Sorry, I couldn\'t find the product you asked about');
                    return Promise.reject();
                }
                return item;
            }).then((item) => {
                session.privateConversationData = Object.assign({}, session.privateConversationData, { product: item });
                session.save();

                showProduct(session, item);

                return item;
            }).then((item) => {
                if (item.modifiers.length === 0 || (item.size.length <= 1 && item.color.length <= 1)) {
                    next();
                } else {
                    builder.Prompts.confirm(session,
                        `This product comes in differnet ` +
                        item.modifiers.map((mod) => `${mod}s`).join(' and ') +
                        '. Would you like to choose one that fits you?', { listStyle: builder.ListStyle.button });
                }
            }).catch((err) => {
                // ToDo: clean the "context" product
                console.error(err);
            });
        },
        function (session, args, next) {
            if (args.response) {
                session.beginDialog('/choseVariant');
            } else if (session.message.text === 'no') {
                // ToDo: add sentiment
                // ToDo: clean the "context" product
                session.endDialog('Alright. I am here if you need anything else');
            } else {
                // no variants, can go straight to "add to card"
                next();
            }
        },
        function (session, args, next) {
            const color = args && args.response && args.response.color && args.response.color.entity;
            const size = args && args.response && args.response.size && args.response.size.entity;

            const product = session.privateConversationData.product;

            search.findVariantForProduct(product.id, color, size).then((variant) => {
                session.privateConversationData = Object.assign({}, session.privateConversationData, { variant });
                session.save();

                if (color || size) {
                    session.sendTyping();
                    session.reset('/showVariant', { variant });
                } else {
                    session.endDialog();
                }
            });
        }
    ]);
};
