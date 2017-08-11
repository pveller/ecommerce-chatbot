'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const co = require('co');
const request = require('request-promise-native');
const moltin = require('moltin')({
    publicId: process.env.MOLTIN_PUBLIC_ID,
    secretKey: process.env.MOLTIN_SECRET_KEY
});
const moltin_p = require('../lib/promisify-moltin')(moltin);

const categories = moltin_p.Category.Tree(null);
const products = co(function* () {
    const list = (offset, limit) => {
        console.log('Fetching products from %s to %s', offset + 1, offset + limit);
        return moltin_p.Product.List({ offset: offset, limit: limit })
    };

    const all = [];
    let current = 0, limit = 100, total = 100;
    while (total > current) {
        let batch = yield list(current, Math.min(limit, total - current));

        total = batch.pagination.total;
        current = batch.pagination.to;

        all.push(...batch);
    }

    return all;
});

Promise.all([categories, products]).then((data) => {
    const categories = data[0];
    const products = data[1];

    console.log(`Collecting data for the categories index`);

    const categoryIndex = categories
        .concat(_.flatMap(categories, c => c.children || []))
        .map(c => ({
            '@search.action': 'upload',
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'parent': c.parent ? c.parent.data.id : null
        }));

    console.log(`Collecting data for the products index`);

    const productIndex = products.filter(p => !p.is_variation).map(p => {
        const categoryKey = Object.keys(p.category.data)[0];
        const category = p.category.data[categoryKey];

        const modifierKeys = Object.keys(p.modifiers);
        const modifiers = modifierKeys.map(key => p.modifiers[key].title);

        const [color, size] = ['color', 'size'].map(variance => {
            return _.chain(modifierKeys)
                .map(key => p.modifiers[key])
                .filter(mod => mod.title === variance)
                .flatMap(mod => Object.keys(mod.variations).map(id => mod.variations[id]))
                .map(variation => variation.title)
                .value();
        });

        const image = {
            domain: p.images[0] ? p.images[0].segments.domain : null,
            suffix: p.images[0] ? p.images[0].segments.suffix : null
        };

        return {
            '@search.action': 'upload',
            'id': p.id,
            'title': p.title,
            'description': p.description,
            'category': category.parent.data.title,
            'categoryId': category.parent.data.id,
            'subcategory': category.title,
            'subcategoryId': category.id,
            'modifiers': modifiers,
            'color': color || null,
            'size': size || null,
            'price': Number(p.price.value.substring(1).replace(',', '')),
            'image_domain': image.domain,
            'image_suffix': image.suffix
        };
    });

    console.log(`Collecting data for the variants index`);

    const variantIndex = products.filter(p => p.is_variation || Object.keys(p.modifiers).length === 0).map(p => {
        const modifierKeys = Object.keys(p.modifiers);
        const [color, size] = ['color', 'size'].map(variance => {
            let key = modifierKeys.find(key => p.modifiers[key].data.title === variance);
            return key ? p.modifiers[key].var_title : null;
        });

        const image = {
            domain: p.images[0] ? p.images[0].segments.domain : null,
            suffix: p.images[0] ? p.images[0].segments.suffix : null
        };

        return {
            '@search.action': 'upload',
            'id': p.id,
            'productId': modifierKeys.length ? p.modifiers[modifierKeys[0]].data.product : p.id,
            'color': color,
            'size': size,
            'sku': p.sku.replace(/^P\*/, ''),
            'price': Number(p.price.value.substring(1).replace(',', '')),
            'image_domain': image.domain,
            'image_suffix': image.suffix
        };
    });

    return {
        categories: categoryIndex,
        products: productIndex,
        variants: variantIndex
    };
}).then((indexes) => {
    const servicename = process.env.SEARCH_APP_NAME;
    const apikey = process.env.SEARCH_API_KEY;
    const headers = {
        'Content-Type': 'application/json',
        'api-key': apikey
    };

    return Promise.all(Object.keys(indexes).map(index => {
        console.log(`Creatings or Updating ${index} index definition in Azure Search`);

        return request({
            url: `https://${servicename}.search.windows.net/indexes/${index}?api-version=2015-02-28`,
            headers,
            method: 'PUT',
            body: fs.createReadStream(path.resolve(__dirname, `${index}.json`))
        }).then(() => {
            console.log(`Loading data for ${index} index in Azure Search`);

            return request({
                url: `https://${servicename}.search.windows.net/indexes/${index}/docs/index?api-version=2015-02-28`,
                headers,
                method: 'POST',
                json: true,
                body: { 
                    value: indexes[index]
                }
            });
        });
    }));
}).then(() => {
    console.log('All said and done');
}).catch((error) => {
    console.log(error);
});
