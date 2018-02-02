const builder = require('botbuilder');

module.exports = function(bot) {
  bot.dialog('/choseVariant', [
    function(session, args, next) {
      const item = (session.dialogData.product = args.product);

      if (!item.modifiers.includes('color')) {
        next();
      } else if (item.color.length === 1) {
        builder.Prompts.confirm(
          session,
          `${item.title} only comes in one color - ${
            item.color[0]
          }. Do you like it?`,
          {
            listStyle: builder.ListStyle.button
          }
        );
      } else {
        builder.Prompts.choice(
          session,
          `Please select what color you'd like best on your ${item.title}`,
          item.color,
          {
            listStyle: builder.ListStyle.button
          }
        );
      }
    },
    function(session, args, next) {
      if (session.message.text === 'no') {
        return session.endDialog(
          "Well, sorry. Come check next time. Maybe we'll have it in the color you like. Thanks!"
        );
      }

      const item = session.dialogData.product;
      // ToDo: response comes back as [true] if the user accepted the single color there was
      session.dialogData.color = args.response || item.color[0];
      session.save();

      if (!item.modifiers.includes('size')) {
        next();
      } else if (item.size.length === 1) {
        builder.Prompts.confirm(
          session,
          `${item.title} only comes in one size - ${item.size[0]}. Is that ok?`,
          {
            listStyle: builder.ListStyle.button
          }
        );
      } else {
        builder.Prompts.choice(
          session,
          `Please select a size for your ${item.title}`,
          item.size,
          {
            listStyle: builder.ListStyle.button
          }
        );
      }
    },
    function(session, args, next) {
      if (session.message.text === 'no') {
        return session.endDialog(
          "Well, sorry. Come check next time. Maybe we'll have your size in stock. Thanks!"
        );
      }

      const item = session.dialogData.product;

      session.dialogData.size = args.response || item.size[0];
      session.save();

      session.endDialogWithResult({
        response: {
          color: session.dialogData.color,
          size: session.dialogData.size
        }
      });
    }
  ]);
};
