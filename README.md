# E-Commerce Chatbot

An example of a chatbot built with [Microsoft Bot Framework](https://dev.botframework.com/) and featuring e-commerce capabilities via:
* [Moltin](https://moltin.com)
* [Azure Search](https://azure.microsoft.com/en-us/services/search)
* [Recommendations API](https://www.microsoft.com/cognitive-services/en-us/recommendations-api)
* [LUIS](https://www.microsoft.com/cognitive-services/en-us/language-understanding-intelligent-service-luis)

I presented this bot on [API Strat](http://boston2016.apistrat.com/) in Boston as an example of a [smart app built with cognitive APIs](http://boston2016.apistrat.com/speakers/pavel-veller).

## Video

I am recording a screencast that I will link here as soon as it's ready. In the meantime, here's a very simple [screen recording of my conversation with the bot](https://www.dropbox.com/s/hzrgzeivroe2n91/conversation.mov?dl=0) and feel free to browse the source code.

## How To Run

If you would like to run it, you would need:
* A [Moltin](https://moltin.com) subscription with the [Adventure Works](https://msftdbprodsamples.codeplex.com/releases/view/125550) data (I previously [shared scripts](https://github.com/pveller/adventureworks-moltin) to import Adventure Works data into Moltin)
* [Azure Search](https://azure.microsoft.com/en-us/services/search) service with three indexes - `categories`, `products`, and `variants`. You can find the index definitions [here](/indexes) and I will soon share the script that creates indexes and loads the data
* [Recommendations API](https://www.microsoft.com/cognitive-services/en-us/recommendations-api) endpoint with the FBT (frequently bought together) model trained on historical orders. I will soon share the script that loads the data and trains the model
* Trained [LUIS](https://www.microsoft.com/cognitive-services/en-us/language-understanding-intelligent-service-luis) model for the intents that require NLU to be recognized. You can import [the app that I trained](/luis) to get a head start

Deploy your bot (I used [Azure App Service](https://azure.microsoft.com/en-us/services/app-service/)) and register it with the [dev.botframework.com](https://dev.botframework.com/).

Set the following environment variables:
* `MICROSOFT_APP_ID` - you will get it from the [dev.botframework.com](https://dev.botframework.com/) during registration
* `MICROSFT_APP_PASSWORD` - you will get it from the [dev.botframework.com](https://dev.botframework.com/) during registration
* `RECOMMENDATION_API_KEY` - your API key to the [Recommendations API](https://www.microsoft.com/cognitive-services/en-us/recommendations-api) service from the [Microsoft Cognitive Services](https://www.microsoft.com/cognitive-services/)
* `RECOMMENDATION_MODEL`- you can create multiple recommendation models and this way you can choose which one the bot will use for suggestions
* `RECOMMENDATION_BUILD` - a given model (your product catalog, historical transactions, and business rules) can have multiple recommendation builds and this is how you tell which one the bot will use
* `SEARCH_APP_NAME` - the name of your [Azure Search](https://azure.microsoft.com/en-us/services/search) service. The code assumes that you have all three indexes in the same Azure Search resource
* `SEARCH_API_KEY`- your API key to the [Azure Search](https://azure.microsoft.com/en-us/services/search) service
* `LUIS_ENDPOINT` - the URL of your published LUIS model (important: https://github.com/Microsoft/BotBuilder/issues/1633)

## To-Do

* The shopping cart is currently kept in the bot's memory (`session.privateConversationData.cart`) and does not sync back to Moltin
* Checkout process is not integrated with Moltin

## License

MIT
