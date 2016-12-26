module.exports = {
    recognize: function(context, callback) {
        const text = context.message.text.replace(/\s/g, '');
        const smiles = text.match(/<sstype="(\w+?)">(.+?)<\/ss>/);

        if (smiles) {            
            callback.call(null, null, {
                intent: 'Smile',
                score: 1,
                entities: [{
                    entity: smiles[1],
                    score: 1,
                    type: 'Type'
                }, {
                    entity: smiles[2],
                    score: 1,
                    type: 'Smile'                    
                }]
            });
        } else {
            callback.call(null, null, {
                intent: null,
                score: 0
            });
        }
    }
};