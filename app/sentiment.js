const request = require('request-promise-native');
const builder = require('botbuilder');

const apiKey = process.env.SENTIMENT_API_KEY;

module.exports = {
  detect: function(text, language = 'en', threshold = 0.05) {
    return request({
      method: 'POST',
      url:
        process.env.SENTIMENT_ENDPOINT ||
        'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey
      },
      body: {
        documents: [
          {
            id: '-',
            language,
            text
          }
        ]
      },
      json: true
    }).then(result => {
      if (result && result.documents) {
        const score = result.documents[0].score;

        console.log(`SENTIMENT: ${score} in ${text}`);

        if (score >= 0.5 + threshold) {
          return {
            response: true,
            score
          };
        } else if (score <= 0.5 - threshold) {
          return {
            response: false,
            score
          };
        } else {
          return Promise.reject(
            `${score} is inconclusive to detect sentiment in ${text}`
          );
        }
      } else {
        return Promise.reject(
          'No response from the sentiment detection service'
        );
      }
    });
  },

  confirm: function(question, reprompt) {
    return [
      (session, args, next) => {
        builder.Prompts.text(session, question);
      },
      (session, args, next) => {
        const answer = builder.EntityRecognizer.parseBoolean(args.response);
        if (typeof answer !== 'undefined') {
          next({
            response: answer
          });
        } else {
          this.detect(args.response)
            .then(result => next(result))
            .catch(error => {
              console.error(error);
              next();
            });
        }
      },
      (session, args, next) => {
        if (args && typeof args.response !== 'undefined') {
          next(args);
        } else {
          reprompt =
            reprompt ||
            'I am sorry, I did not understand what you meant. ' +
              "See if you can use the buttons or reply with a simple 'yes' or 'no'. " +
              'Sorry again!';

          session.send(reprompt);

          builder.Prompts.confirm(session, question, {
            listStyle: builder.ListStyle.button
          });
        }
      }
    ];
  }
};
