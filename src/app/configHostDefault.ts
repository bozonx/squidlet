export default {
  // default params for connections
  connections: {
    i2c: {
      pollInterval: 100,
    }
  },
  fileNames: {
    manifestFileName: 'device.yaml',
  },

  // publish status interval every minute if status hasn't been changed
  republishIntervalMs: 60000,

  routedMessageTTL: 100,
};
