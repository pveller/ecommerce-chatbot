module.exports = {
  "extends": "prettier",
  "parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module",
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true
    }
  },
  "env": {
    "es6": true,
    "node": true
  },
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": ["error", { "singleQuote": true }]
  }
};