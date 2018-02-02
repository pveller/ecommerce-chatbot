const greetings = [
  'hi',
  'hi there',
  'hey',
  'hey there',
  'hello',
  'hello hello',
  'hello there',
  'what up',
  "what's up",
  'whatup',
  'salute',
  'morning',
  'good morning',
  'how are you',
  'how r u'
];

module.exports = {
  recognize: function(context, callback) {
    const text = context.message.text
      .replace(/[!?,.\/\\\[\]\{\}\(\)]/g, '')
      .trim()
      .toLowerCase();

    const recognized = {
      entities: [],
      intent: null,
      matched: undefined,
      expression: undefined,
      intents: [],
      score: 0
    };

    if (greetings.some(phrase => text === phrase)) {
      recognized.intent = 'Greeting';
      recognized.score = 1;
    }

    callback.call(null, null, recognized);
  }
};
