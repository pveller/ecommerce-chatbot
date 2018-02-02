# UPDATE

Microsoft is discontinuing the Recommendations API preview in February 2018. The alternative is to deploy the [Recommendations Solution](https://gallery.cortanaintelligence.com/Tutorial/Recommendations-Solution) template, but it does not yet support the frequently bought together algorithm that the bot was using. The deployment of a solution template is aslo a more involved process so I decided to drop recommendations for now. The recommendation code is still there and is just not used by the dialog flow at the moment.

# Azure Recommendations API

First, head over to the [Adventure Works Moltin](https://github.com/pveller/adventureworks-moltin) and run [the script](https://github.com/pveller/adventureworks-moltin/blob/master/recommendations.js) that will generate the data you need to feed the recommendation engine. I didn't re-create historical transactions as orders in Moltin so the script will use the original source data to build the recommendation model.

You should now have two files alongside your Adventure Works catalog:

* `recommendations-catalog.csv` - product catalog with attributes
* `recommendations-usage.csv` - the list of historical purchases

Subscribe for [Azure Recommendations API](https://azure.microsoft.com/en-us/services/cognitive-services/recommendations/) and set the following environment variable:

* `RECOMMENDATION_API_KEY` - your API key to the Recommendations API

You can now run:

```bash
$ node recommendations/populate.js "/Users/you/path-to-CSVs" "Model_Name" "Model Description"
```

or with the environment variable:

```bash
$ RECOMMENDATION_API_KEY=yourkey node recommendations/populate.js "/Users/you/path-to-CSVs" "Model_Name" "Model Description"
```

If you don't provide the name and/or the description, the script will use the defaults: `eComm-Chatbot` and `FBT build for Adventure Works`.

The script will output the recommendation **model** and recommendation **build** that was trained. Example output:

```
There is already a recommendation model named eComm-Chatbot. The existing model needs to be deleted first
Model 8b33ed58-5d8a-4b5a-a1fb-3a3fcd7e043c created succesfully
Succesfully imported 295 catalog entries
Succesfully imported 121317 sales records
FBT build 1647571 created succesfully. Will now wait for the training to finish.
Training is Running. Will check again in 30 seconds...
Training is Running. Will check again in 30 seconds...
Training is Running. Will check again in 30 seconds...
Training is Running. Will check again in 30 seconds...
Training is Running. Will check again in 30 seconds...
Build training finished: Succeeded
All said and done
Set RECOMMENDATION_MODEL to 8b33ed58-5d8a-4b5a-a1fb-3a3fcd7e043c
Set RECOMMENDATION_BUILD to 1647571
```

You will use these values to populate the following environment variables that your ecommerce bot needs to use recommendations:

* `RECOMMENDATION_MODEL`- you can create multiple recommendation models and this way you can choose which one the bot will use for suggestions
* `RECOMMENDATION_BUILD` - a given model (your product catalog, historical transactions, and business rules) can have multiple recommendation builds and this is how you tell which one the bot will use
