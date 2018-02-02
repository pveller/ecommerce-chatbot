const search = require('../search/search');

module.exports = function(bot) {
  bot.dialog('/categories', [
    function(session, args, next) {
      session.sendTyping();

      search.listTopLevelCategories().then(value => next(value));
    },
    function(session, args, next) {
      const message = (args || [])
        .map(v => v.title)
        .filter(t => t !== 'Uncategorized')
        .join(', ');

      session.endDialog('We have ' + message);
    }
  ]);
};
