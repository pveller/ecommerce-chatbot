const restify = require('restify');
const builder = require('botbuilder');

const greeting = require('./app/recognizer/greeting');
const commands = require('./app/recognizer/commands');
const smiles = require('./app/recognizer/smiles');

const dialog = {
  welcome: require('./app/dialogs/welcome'),
  categories: require('./app/dialogs/categories'),
  explore: require('./app/dialogs/explore'),
  showProduct: require('./app/dialogs/showProduct'),
  choseVariant: require('./app/dialogs/choseVariant'),
  showVariant: require('./app/dialogs/showVariant'),
  addToCart: require('./app/dialogs/addToCart'),
  showCart: require('./app/dialogs/showCart')
};

const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSFT_APP_PASSWORD
});

const bot = new builder.UniversalBot(connector, {
  persistConversationData: true
});

var intents = new builder.IntentDialog({
  recognizers: [
    commands,
    greeting,
    new builder.LuisRecognizer(process.env.LUIS_ENDPOINT)
  ],
  intentThreshold: 0.2,
  recognizeOrder: builder.RecognizeOrder.series
});

intents.matches('Greeting', '/welcome');
intents.matches('ShowTopCategories', '/categories');
intents.matches('Explore', '/explore');
intents.matches('Next', '/next');
intents.matches('ShowProduct', '/showProduct');
intents.matches('AddToCart', '/addToCart');
intents.matches('ShowCart', '/showCart');
intents.matches('Checkout', '/checkout');
intents.matches('Reset', '/reset');
intents.matches('Smile', '/smileBack');
intents.onDefault('/confused');

bot.dialog('/', intents);
dialog.welcome(bot);
dialog.categories(bot);
dialog.explore(bot);
dialog.showProduct(bot);
dialog.choseVariant(bot);
dialog.showVariant(bot);
dialog.addToCart(bot);
dialog.showCart(bot);

bot.dialog('/confused', [
  function(session, args, next) {
    // ToDo: need to offer an option to say "help"
    if (session.message.text.trim()) {
      session.endDialog(
        "Sorry, I didn't understand you or maybe just lost track of our conversation"
      );
    } else {
      session.endDialog();
    }
  }
]);

bot.on('routing', smiles.smileBack.bind(smiles));

bot.dialog('/reset', [
  function(session, args, next) {
    session.endConversation(['See you later!', 'bye!']);
  }
]);

bot.dialog('/checkout', [
  function(session, args, next) {
    const cart = session.privateConversationData.cart;

    if (!cart || !cart.length) {
      session.send(
        'I would be happy to check you out but your cart appears to be empty. Look around and see if you like anything'
      );
      session.reset('/categories');
    } else {
      session.endDialog('Alright! You are all set!');
    }
  }
]);

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
  console.log('%s listening to %s', server.name, server.url);
});
server.get(
  /.*/,
  restify.serveStatic({
    directory: '.',
    default: 'index.html'
  })
);
server.post('/api/messages', connector.listen());
