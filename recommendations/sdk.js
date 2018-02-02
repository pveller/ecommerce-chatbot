// Wrappers over recommendations REST APIs

const request = require('request-promise-native');
const fs = require('fs');

const readFileAndPost = (file, options) =>
  new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        reject(err);
      } else {
        request(
          Object.assign({}, options, {
            body: data
          })
        )
          .then(response => {
            resolve(JSON.parse(response));
          })
          .catch(reject);
      }
    });
  });

module.exports = apikey => {
  const headers = {
    'Ocp-Apim-Subscription-Key': apikey
  };

  const headersJson = Object.assign({}, headers, {
    'Content-Type': 'application/json'
  });

  const headersBinary = Object.assign({}, headers, {
    'Content-Type': 'application/octet-stream'
  });

  return {
    model: {
      list: () =>
        request({
          uri:
            'https://westus.api.cognitive.microsoft.com/recommendations/v4.0/models',
          headers,
          json: true
        }),
      delete: id =>
        request({
          uri: `https://westus.api.cognitive.microsoft.com/recommendations/v4.0/models/${id}`,
          method: 'DELETE',
          headers
        }),
      create: (modelName, description) =>
        request({
          uri:
            'https://westus.api.cognitive.microsoft.com/recommendations/v4.0/models',
          method: 'POST',
          headers: headersJson,
          json: true,
          body: { modelName, description }
        })
    },

    upload: {
      catalog: (modelId, name, file) =>
        readFileAndPost(file, {
          uri: `https://westus.api.cognitive.microsoft.com/recommendations/v4.0/models/${modelId}/catalog?catalogDisplayName=${name}`,
          method: 'POST',
          headers: headersBinary
        }).then(results => {
          if (
            results.errorLineCount > 0 ||
            (results.errorSummary && results.errorSummary.length > 0)
          ) {
            console.warn(
              `Catalog imported with ${results.errorLineCount} errors.\n${(
                results.errorSummary || []
              ).join('\n')} `
            );
          } else {
            console.info(
              `Succesfully imported ${
                results.importedLineCount
              } catalog entries`
            );
          }
        }),

      usage: (modelId, name, file) =>
        readFileAndPost(file, {
          uri: `https://westus.api.cognitive.microsoft.com/recommendations/v4.0/models/${modelId}/usage?usageDisplayName=${name}`,
          method: 'POST',
          headers: headersBinary
        }).then(results => {
          if (
            results.errorLineCount > 0 ||
            (results.errorSummary && results.errorSummary.length > 0)
          ) {
            console.warn(
              `Usage data imported with ${results.errorLineCount} errors.\n${(
                results.errorSummary || []
              ).join('\n')} `
            );
          } else {
            console.info(
              `Succesfully imported ${results.importedLineCount} sales records`
            );
          }
        })
    },

    build: {
      fbt: (modelId, description) =>
        request({
          uri: `https://westus.api.cognitive.microsoft.com/recommendations/v4.0/models/${modelId}/builds`,
          method: 'POST',
          headers: headersJson,
          json: true,
          body: {
            description,
            buildType: 'fbt',
            buildParameters: {
              // using the defaults
            }
          }
        }),

      get: (modelId, buildId) =>
        request({
          uri: `https://westus.api.cognitive.microsoft.com/recommendations/v4.0/models/${modelId}/builds/${buildId}`,
          headers,
          json: true
        })
    }
  };
};
