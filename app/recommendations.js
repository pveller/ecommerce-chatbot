const request = require('request-promise-native');
const _ = require('lodash');

const url =
  'https://westus.api.cognitive.microsoft.com/recommendations/v4.0/models/';
const apiKey = process.env.RECOMMENDATION_API_KEY;
const model = process.env.RECOMMENDATION_MODEL;
const build = process.env.RECOMMENDATION_BUILD;

module.exports = {
  recommend: function(skus, howmany = 3, threashold = 0.5) {
    return request({
      url:
        `${url}/${model}/recommend/item?build=${build}` +
        `&itemIds=${skus.join(',')}` +
        `&numberOfResults=${howmany}` +
        `&minimalScore=${threashold}` +
        `&includeMetadata=false`,
      headers: { 'Ocp-Apim-Subscription-Key': `${apiKey}` }
    }).then(result => {
      const obj = JSON.parse(result) || {};

      return obj.recommendedItems;
    });
  }
};
