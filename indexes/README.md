# Azure Search Indexes

The bot needs three indexes in Azure Search: `categories`, `products`, and `variants`. You can run `populate.js` to get it all set up:

1) Sign up for Azure and create a new Azure Search service. I named mine `commercechat`.

2) Set up two environment variables just like you need for the bot:

* `SEARCH_APP_NAME` - the name of your [Azure Search](https://azure.microsoft.com/en-us/services/search) service. The code assumes that you have all three indexes in the same Azure Search resource
* `SEARCH_API_KEY`- your API key to the [Azure Search](https://azure.microsoft.com/en-us/services/search) service

3) Run the script like this from the project root:

```bash
$ node indexes/populate.js
```

Here's how you would run the script with the environment variables set for the time of its execution:

```bash
$ SEARCH_APP_NAME=commercechat SEARCH_API_KEY=mykey node indexes/populate.js
```


