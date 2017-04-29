const detectors = {
    'emulator': /([:;]-?[\(\)DE])/,
    'webchat': /([:;]-?[\(\)DE])/,
    'skype': /(<ss type="\w+?">.+?<\/ss>)/
}

module.exports = {
    recognize: function(context, callback) {
        const text = context.message.text;
        const channel = context.message.address.channelId;

        console.log('Looking for smile in [%s] on [%s]', text, channel);

        if (!detectors[channel]) {
            return callback.call();
        }

        const smiles = text.match(detectors[channel]);
        if (!smiles) {
            return callback.call();
        }

        console.log('Sending back a smily face %s', smiles[1]);

        callback.call(null, null, {
            intent: 'Smile',
            score: 1,
            entities: [{
                entity: smiles[1],
                score: 1,
                type: 'Smile'
            }]
        });
    }
};