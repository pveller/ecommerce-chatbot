const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');
const sdk = require('./sdk')(process.env.RECOMMENDATION_API_KEY);
const repeater = require('./repeater');

const catalog = process.argv[2];
if (!catalog || !fs.existsSync(catalog)) {
  throw 'Please specify a valid file system path where you generated recommendations-catalog.csv and recommendations-usage.csv';
}

const modelName = process.argv[3] || 'eComm-Chatbot';
const description = process.argv[4] || 'Adventure Works Recommendations';

let model = undefined;
let build = undefined;

sdk.model
  .list()
  .then(({ models }) => {
    const model = models.find(m => m.name === modelName);
    if (model) {
      console.log(
        `There is already a recommendation model named ${modelName}. The existing model needs to be deleted first`
      );

      return sdk.model.delete(model.id);
    } else {
      return Promise.resolve();
    }
  })
  .then(() => {
    return sdk.model.create(modelName, description);
  })
  .then(result => {
    model = result;

    console.log(`Model ${model.id} created succesfully`);
  })
  .then(() => {
    return sdk.upload.catalog(
      model.id,
      'AdventureWorks',
      path.resolve(catalog, 'recommendations-catalog.csv')
    );
  })
  .then(() => {
    return sdk.upload.usage(
      model.id,
      'OnlineSales',
      path.resolve(catalog, 'recommendations-usage.csv')
    );
  })
  .then(() => {
    return sdk.build.fbt(model.id, 'FBT build for Adventure Works');
  })
  .then(result => {
    build = result;

    console.log(
      `FBT build ${
        build.buildId
      } created succesfully. Will now wait for the training to finish.`
    );

    return repeater.repeat(() => sdk.build.get(model.id, build.buildId), {
      delay: 30000,
      until: response => !['NotStarted', 'Running'].includes(response.status),
      done: response =>
        console.log(`Build training finished: ${response.status}`),
      next: (response, delay) =>
        console.log(
          `Training is ${response.status}. Will check again in ${delay /
            1000} seconds...`
        )
    });
  })
  .then(() => {
    console.log('All said and done');
    console.log(`Set RECOMMENDATION_MODEL to ${model.id}`);
    console.log(`Set RECOMMENDATION_BUILD to ${build.buildId}`);
  })
  .catch(error => {
    console.error(error);
  });
