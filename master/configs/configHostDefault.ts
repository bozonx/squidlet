export default {
  host: {
    defaultStatusRepublishIntervalMs: 60000,
    defaultConfigRepublishIntervalMs: 600000,
  },



  // TODO: review

  // default params for connections
  connections: {
    i2c: {
      pollInterval: 10,
    }
  },

  fileNames: {
    manifestFileName: 'device.yaml',
  },

  network: {
    routedMessageTTL: 10,
    // timeout of waiting of request has finished in ms
    requestTimeout: 60000,
  },
};
