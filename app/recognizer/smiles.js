const detectors = {
  emulator: {
    pattern: '[:;]-?[()DE]'
  },
  webchat: {
    pattern: '[:;]-?[()DE]'
  },
  skype: {
    pattern: '<ss type=".+?">(.+?)</ss>',
    smileAt: 1
  }
};

module.exports = {
  detect: function(text, channel) {
    console.log('Looking for smile in [%s] on [%s]', text, channel);

    const detector = detectors[channel];
    if (!detector) {
      return undefined;
    }

    const smiles = text.match(new RegExp(detector.pattern));
    if (!smiles) {
      return undefined;
    }

    return smiles[detector.smileAt || 0];
  },

  recognize: function(context, callback) {
    const text = context.message.text;
    const channel = context.message.address.channelId;

    const smile = this.detect(text, channel);

    if (!smile) {
      callback();
    } else {
      console.log('Sending back a smily face [%s]', smile);

      callback(null, {
        intent: 'Smile',
        score: 1,
        entities: [
          {
            entity: smile,
            score: 1,
            type: 'Smile'
          }
        ]
      });
    }
  },

  smileBack: function(session) {
    const text = session.message.text;
    const channel = session.message.address.channelId;

    const smile = this.detect(text, channel);

    if (smile) {
      session.send(smile);

      const smiles = new RegExp(detectors[channel].pattern, 'g');
      session.message.text = session.message.text.replace(smiles, '');

      if (session.message.text.trim()) {
        session.sendTyping();
      }
    }
  }
};
