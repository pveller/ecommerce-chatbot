const detectors = {
    emulator: {
        pattern: /([:;]-?[\(\)DE])/
    },
    webchat: {
        pattern: /([:;]-?[\(\)DE])/
    },
    skype: {
        pattern: /<ss type="(\w+?)">(.+?)<\/ss>/,
        smile: 2
    }
}

module.exports = {
    recognize: function(context, callback) {
        const text = context.message.text;
        const channel = context.message.address.channelId;
        
        console.log('Looking for smile in [%s] on [%s]', text, channel);

        const detector = detectors[channel];
        if (!detector) {
            return callback.call();
        }

        const smiles = text.match(detector.pattern);
        if (!smiles) {
            return callback.call();
        }

        console.log('Sending back a smily face %s', smiles[1]);

        callback.call(null, null, {
            intent: 'Smile',
            score: 1,
            entities: [{
                entity: smiles[detector.smile || 1],
                score: 1,
                type: 'Smile'
            }]
        });
    }
};