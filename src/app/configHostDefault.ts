export default {
  // default params for connections
  connections: {
    i2c: {
      pollInterval: 10,
    }
  },
  fileNames: {
    manifestFileName: 'device.yaml',
  },

  // publish status interval every minute if status hasn't been changed in ms
  republishIntervalMs: 60000,

  network: {
    routedMessageTTL: 10,
    // timeout of waiting of request has finished in ms
    requestTimeout: 60000,
  },
};
