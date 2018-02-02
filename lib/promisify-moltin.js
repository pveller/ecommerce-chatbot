const request = require('request');
const fs = require('fs');

const promisify = moltin => {
  const promisified = {};

  const executor = (actor, action) =>
    function() {
      const args = [...arguments];

      let success = (result, pagination) => {
        if (result) {
          result.pagination = pagination;
        }

        return result;
      };

      let error = (error, details) => details;

      if (typeof args[args.length - 1] === 'function') {
        if (typeof args[args.length - 2] === 'function') {
          error = args.pop();
          success = args.pop();
        } else {
          success = args.pop();
        }
      }

      return new Promise((resolve, reject) => {
        moltin.Authenticate(function() {
          actor[action].call(
            actor,
            ...args,
            (result, pagination) => {
              resolve(success.call(null, result, pagination));
            },
            (err, details) => {
              console.error(details);
              reject(error.call(null, details));
            }
          );
        });
      });
    };

  Object.keys(moltin)
    .filter(key => key !== 'options' && typeof moltin[key] === 'object')
    .forEach(member => {
      promisified[member] = {};
      let actor = moltin[member];

      Object.keys(actor.__proto__)
        .concat(Object.keys(actor.__proto__.__proto__))
        .filter(action => typeof actor[action] === 'function')
        .forEach(action => {
          promisified[member][action] = executor(actor, action);
        });
    });

  return promisified;
};

module.exports = function(moltin) {
  const promisified = promisify(moltin);

  promisified.Image = {
    Create: image =>
      new Promise((resolve, reject) => {
        moltin.Authenticate(function() {
          request.post(
            {
              url: 'https://api.molt.in/v1/files',
              headers: {
                Authorization: moltin.options.auth.token,
                'Content-Type': 'multipart/form-data'
              },
              formData: {
                file: fs.createReadStream(image.file),
                assign_to: image.assignTo
              }
            },
            (err, response, body) => {
              if (response.statusCode !== 200 && response.statusCode !== 201) {
                console.error(
                  'Failed to upload an image [%s] -> %s',
                  image.file,
                  response.body
                );
                reject(response.body);
              }

              resolve(JSON.parse(body));
            }
          );
        });
      })
  };

  promisified.Product.RemoveAll = function() {
    const clean = () => {
      return this.List(null).then(products => {
        const total = products.pagination.total;
        const current = products.pagination.current;

        console.log('Processing the first %s of %s total', current, total);

        const deleted = Promise.all(
          products.map(p => {
            console.log('Requesting a delete of %s', p.title);
            return this.Delete(p.id).catch(() => null);
          })
        );

        return total <= current ? deleted : deleted.then(() => clean());
      });
    };

    return clean();
  };

  return promisified;
};
