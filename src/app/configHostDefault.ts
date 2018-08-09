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

  devices: {
    // republish status silently every minute if it hasn't been changed
    defaultStatusRepublishIntervalMs: 60000,
    // republish config silently every 10 minutes if it hasn't been changed
    defaultConfigRepublishIntervalMs: 600000,
  },

  network: {
    routedMessageTTL: 10,
    // timeout of waiting of request has finished in ms
    requestTimeout: 60000,
  },
};
