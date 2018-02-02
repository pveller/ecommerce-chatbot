'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const request = require('request-promise-native');

const MoltinGateway = require('@moltin/sdk').gateway;
const Moltin = MoltinGateway({
  client_id: process.env.MOLTIN_CLIENT_ID,
  client_secret: process.env.MOLTIN_CLIENT_SECRET
});

if (!Moltin.Files) {
  // Moltin JS SDK does not support files operation in 3.3.0
  Moltin.Files = Object.setPrototypeOf(
    Object.assign({}, Moltin.Products),
    Moltin.Products
  );
  Moltin.Files.endpoint = 'files';
}

(async function() {
  // There are only 42 images in the AW catalog and the default pagination limit in Moltin API is 100
  const images = (await Moltin.Files.All()).data;
  // A quick a way to pull up an image by id
  const imagesLookup = _.groupBy(images, image => image.id);

  // Tree reads all the categories in one go
  const taxonomy = (await Moltin.Categories.Tree()).data;
  for (let topCategory of taxonomy) {
    for (let child of topCategory.children) {
      child.parent = topCategory;
    }
  }

  // In AW, products link to sub-categories, not the top level categories
  const categories = _.flatMap(taxonomy, category => category.children || []);
  // A quick way to pull up a category by id
  const categoryLookup = _.groupBy(categories, category => category.id);

  // Need to recursively read all products
  const catalog = await (async function read(offset = 0, all = []) {
    Moltin.Products.Offset(offset);
    const { data, meta } = await Moltin.Products.All();

    all.push(...data);

    const total = meta.results.all;
    const processed =
      (meta.page.current - 1) * meta.page.limit + meta.results.total;

    return total > processed ? await read(processed, all) : all;
  })();

  // Top level products were all created with a generated sku number
  // actual SKUs that can be purchased are all on the variants
  const allProducts = catalog.filter(record => /^AW_\d+$/.test(record.sku));
  const allVariants = catalog.filter(record => !/^AW_\d+$/.test(record.sku));

  for (let variant of allVariants) {
    // When we load Adventure Works to Moltin, we give variants
    // JSON metadata indicating what color and size this variant represents
    // and also what product is the parent product for this variant
    variant.description = JSON.parse(variant.description);
  }
  // A quick way to pull up a list of product's variants
  const variantsLookup = _.groupBy(allVariants, v => v.description.parent);

  console.log(`Collecting data for the categories index`);

  const categoryIndex = taxonomy.concat(categories).map(category => ({
    '@search.action': 'upload',
    id: category.id,
    title: category.name,
    description: category.description,
    parent: category.parent ? category.parent.id : null
  }));

  console.log(`Collecting data for the products index`);

  const productIndex = allProducts.map(product => {
    const categoryId = product.relationships.categories.data[0].id;

    const category = categoryLookup[categoryId][0];
    const variants = variantsLookup[product.id];

    const modifiers = _.chain(variants)
      .flatMap(variant =>
        _.without(Object.keys(variant.description), 'parent').filter(key =>
          Boolean(variant.description[key])
        )
      )
      .uniq()
      .value();

    const [color, size] = ['color', 'size'].map(modifier =>
      _.chain(variants)
        .map(variant => variant.description[modifier])
        .uniq()
        .filter(Boolean)
        .value()
    );

    const image = imagesLookup[product.relationships.main_image.data.id][0];

    return {
      '@search.action': 'upload',
      id: product.id,
      title: product.name,
      description: product.description,
      category: category.parent.name,
      categoryId: category.parent.id,
      subcategory: category.name,
      subcategoryId: category.id,
      modifiers: modifiers,
      color: color, // ToDo: check how empty arrays are created in Azure Search
      size: size,
      price: Number(product.price[0].amount),
      image: image.link.href
    };
  });

  console.log(`Collecting data for the variants index`);

  // ToDo: double check that products without modifiers (no variations relations)
  // actually have their single variant created in Moltin

  const variantIndex = allVariants.map(variant => {
    const [color, size] = ['color', 'size'].map(
      modifier => variant.description[modifier] || null
    );

    const image = imagesLookup[variant.relationships.main_image.data.id][0];

    return {
      '@search.action': 'upload',
      id: variant.id,
      productId: variant.description.parent,
      color: color,
      size: size,
      sku: variant.sku,
      price: Number(variant.price[0].amount),
      image: image.link.href
    };
  });

  const indexes = {
    categories: categoryIndex,
    products: productIndex,
    variants: variantIndex
  };

  const servicename = process.env.SEARCH_APP_NAME;
  const apikey = process.env.SEARCH_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'api-key': apikey
  };

  for (let index of Object.keys(indexes)) {
    console.log('Deleting %s index in Azure Search', index);
    try {
      await request({
        url: `https://${servicename}.search.windows.net/indexes/${index}?api-version=2016-09-01`,
        headers,
        method: 'DELETE'
      });
    } catch (error) {
      console.error(error);
    }

    console.log('(Re)creating %s index in Azure Search', index);
    await request({
      url: `https://${servicename}.search.windows.net/indexes/${index}?api-version=2016-09-01`,
      headers,
      method: 'PUT',
      body: fs.createReadStream(path.resolve(__dirname, `${index}.json`))
    });

    console.log('Loading data for %s index in Azure Search', index);
    await request({
      url: `https://${servicename}.search.windows.net/indexes/${index}/docs/index?api-version=2016-09-01`,
      headers,
      method: 'POST',
      json: true,
      body: {
        value: indexes[index]
      }
    });
  }

  console.log('All said and done');
})();
