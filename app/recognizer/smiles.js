const detectors = {
    emulator: {
        pattern: /[:;]-?[\(\)DE]/g
    },
    webchat: {
        pattern: /[:;]-?[\(\)DE]/g
    },
    skype: {
        pattern: /<ss type="(\w+?)">(.+?)<\/ss>/g,
        smile: 2
    }
}

module.exports = {

    detect: function (text, channel) {
        console.log('Looking for smile in [%s] on [%s]', text, channel);

        const detector = detectors[channel];
        if (!detector) {
            return undefined;
        }

        const smiles = text.match(detector.pattern);
        if (!smiles) {
            return undefined;
        }

        return {
            pattern: detector.pattern,
            face: smiles[detector.smile || 0]
        };
    },

    recognize: function (context, callback) {
        const text = context.message.text;
        const channel = context.message.address.channelId;

        const smile = this.detect(text, channel);
        if (!smile) {
            callback();
        } else {
            console.log('Sending back a smily face %s', smile.face);

            callback(null, {
                intent: 'Smile',
                score: 1,
                entities: [{
                    entity: smile.face,
                    score: 1,
                    type: 'Smile'
                }]
            });
        }
    },

    smileBack: function (session) {
        const text = session.message.text;
        const channel = session.message.address.channelId;

        const smile = this.detect(text, channel);

        if (smile) {
            session.send(smile.face);

            session.message.text = session.message.text.replace(smile.pattern, '');

            if (session.message.text.trim()) {
                session.sendTyping();
            }
        }
    }
};