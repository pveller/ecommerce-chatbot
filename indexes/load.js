const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');

const index = process.argv[2]; // index name
const data = process.argv[3]; // json file to load
const servicename = process.env.SEARCH_APP_NAME;
const apikey = process.env.SEARCH_API_KEY;

if (!index) {
    throw 'Please specify the Azure Search index name as the first command line argument';
}

if (!data || !fs.existsSync(data)) {
    throw `Please specify a valid path for the file that has the index definition (JSON) for [${index}] as a second command line argument`;
}

if (!servicename) {
    throw 'Please set SEARCH_APP_NAME environment variable to represent the Azure Search service name hosting the indexes';
}

if (!apikey) {
    throw 'Please set SEARCH_API_KEY with your Azure Search service API key';
}

request({
// Create or Update the index in Azure Search
    url: `https://${servicename}.search.windows.net/indexes/${index}?api-version=2015-02-28`,
    headers: {
        'Content-Type': 'application/json',
        'api-key': apikey
    },
    method: 'PUT',
    body: fs.createReadStream(path.resolve(__dirname, `${index}.json`))
}).then(() => request({
// Push the data into the index
    url: `https://${servicename}.search.windows.net/indexes/${index}/docs/index?api-version=2015-02-28`,
    headers: {
        'Content-Type': 'application/json',
        'api-key': apikey
    },
    method: 'POST',
    body: fs.createReadStream(data)
})).then(() => {
    console.log('All done');
}).catch(error => {
    throw error;
});