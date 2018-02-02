const unrecognized = {
  entities: [],
  intent: null,
  intents: [],
  score: 0
};

const parse = {
  parse: function(context, text) {
    const parts = text.split(':');
    const command = parts[0];

    console.log('Resolved [%s] as [%s] command', text, command);

    const action = this[command] || this[command.slice(1)];
    if (!action) {
      return unrecognized;
    } else {
      return action.call(this, context, ...parts.slice(1));
    }
  },

  list: (context, parent) => ({
    entities: [
      {
        entity: parent,
        score: 1,
        type: 'Entity'
      }
    ],
    intent: parent ? 'Explore' : 'ShowTopCategories',
    score: 1
  }),
  search: (context, query) => ({
    entities: [
      {
        entity: query,
        score: 1,
        type: 'Entity'
      }
    ],
    intent: 'Explore',
    score: 1
  }),
  next: () => ({
    intent: 'Next',
    score: 1
  }),
  more: function(context, product) {
    return this.next(context, product);
  },
  show: (context, product) => ({
    entities: [
      {
        entity: product,
        score: 1,
        type: 'Product'
      }
    ],
    intent: 'ShowProduct',
    score: 1
  }),
  cart: () => ({
    intent: 'ShowCart',
    score: 1
  }),
  add: (context, what) => ({
    entities: [
      {
        entity: what,
        score: 1,
        type: 'Id'
      }
    ],
    intent: 'AddToCart',
    score: 1
  }),
  remove: (context, what) => {
    console.log('Remove from cart is not supported');
    return unrecognized;
  },
  checkout: () => ({
    intent: 'Checkout',
    score: 1
  }),
  reset: () => ({
    intent: 'Reset',
    score: 1
  })
};

module.exports = {
  recognize: function(context, callback) {
    const text = context.message.text;

    if (!text.startsWith('@') && !['next', 'more'].includes(text)) {
      callback.call(null, null, unrecognized);
    } else {
      callback.call(null, null, parse.parse(context, text));
    }
  }
};
