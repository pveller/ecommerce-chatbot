# E-Commerce Chatbot

An example of a chatbot built with [Microsoft Bot Framework](https://dev.botframework.com/) and featuring e-commerce capabilities via [Moltin](https://moltin.com), [Azure Search](https://azure.microsoft.com/en-us/services/search), [Recommendations API](https://www.microsoft.com/cognitive-services/en-us/recommendations-api), and [LUIS](https://www.microsoft.com/cognitive-services/en-us/language-understanding-intelligent-service-luis).

If you would like to run it, you would need:
* A [Moltin](https://moltin.com) subscription with the [Adventure Works](https://msftdbprodsamples.codeplex.com/releases/view/125550) data (I shared [scripts to load it](https://github.com/pveller/adventureworks-moltin))
* Three Azure Search indexes - `categories`, `products`, and `variants`. I will soon share the script that creates indexes and loads the data
* Recommendation API endpoint with the FBT (frequently bought together) model trained on historical orders. I will soon share the scripts that loads the data and trains the model.

## Details

I am recording a screencast that I will link here as soon as it's ready. In the meantime, please feel free to browse the source code. 

## To-Do

* The shopping cart is currently kept in the bot's memory (`session.privateConversationData.cart`) and does not sync to Moltin
* Checkout process is not integrated with Moltin

## License

MIT
