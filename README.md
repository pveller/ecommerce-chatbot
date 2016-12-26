# E-Commerce Chatbot

An example of a chatbot built with [Microsoft Bot Framework](https://dev.botframework.com/) and featuring e-commerce capabilities via:
* [Moltin](https://moltin.com)
* [Azure Search](https://azure.microsoft.com/en-us/services/search)
* [Recommendations API](https://www.microsoft.com/cognitive-services/en-us/recommendations-api)
* [LUIS](https://www.microsoft.com/cognitive-services/en-us/language-understanding-intelligent-service-luis)

I presented this bot on [API Strat](http://boston2016.apistrat.com/) in Boston as an example of a [smart app built with cognitive APIs](http://boston2016.apistrat.com/speakers/pavel-veller).

If you would like to run it, you would need:
* A [Moltin](https://moltin.com) subscription with the [Adventure Works](https://msftdbprodsamples.codeplex.com/releases/view/125550) data (I shared [scripts to load it](https://github.com/pveller/adventureworks-moltin))
* Three [Azure Search](https://azure.microsoft.com/en-us/services/search) indexes - [`categories`](/blob/master/indexes/categories.json), [`products`](/blob/master/indexes/products.json), and [`variants`](/blob/master/indexes/variants.json). I will soon share the script that creates indexes and loads the data
* [Recommendations API](https://www.microsoft.com/cognitive-services/en-us/recommendations-api) endpoint with the FBT (frequently bought together) model trained on historical orders. I will soon share the scripts that loads the data and trains the model.

## Details

I am recording a screencast that I will link here as soon as it's ready. In the meantime, please feel free to browse the source code. 

## To-Do

* The shopping cart is currently kept in the bot's memory (`session.privateConversationData.cart`) and does not sync to Moltin
* Checkout process is not integrated with Moltin

## License

MIT
