const builder = require('botbuilder');
const search = require('../search/search');

const showVariant = function(session, variant) {
    session.sendTyping();
    
    const description = `${variant.color ? 'Color -' + variant.color + '\n' : ''}` +
                        `${variant.size ? 'Size -' + variant.size : ''}`;
    const product = session.privateConversationData.product;
    const tile = new builder.HeroCard(session)
        .title(product.title)
        .subtitle(`$${variant.price}`)
        .text(description || product.description)
        .buttons([builder.CardAction.postBack(session, `@add:${variant.id}`, 'Add To Cart')])
        .images([builder.CardImage.create(session, `https://${product.image_domain}${product.image_suffix}`)]);

    session.send(new builder.Message(session)
        .text('I am ready when you are')
        .attachments([tile]));
};

module.exports = function (bot) {
    bot.dialog('/showVariant', [
        function (session, args, next) {
            if (!args || !args.variant) {
                return session.endDialog('Sorry, I got distracted and lost track of our conversation. Where were we?');
            }

            showVariant(session, args.variant);
            session.endDialog();
        }
    ]);
}