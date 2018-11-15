export default {
  config: {
    logLevel: 'info',
    // TODO: set 60000
    defaultStatusRepublishIntervalMs: 10000,
    defaultConfigRepublishIntervalMs: 600000,
    drivers: {
      defaultDigitalInputDebounce: 20,
      defaultPollInterval: 300,
    },

    // TODO: review

    // default params for connections
    connections: {
      i2c: {
        pollInterval: 10,
      }
    },

    // TODO: review

    network: {
      routedMessageTTL: 10,
      // timeout of waiting of request has finished in ms
      requestTimeout: 60000,
    },
  },
};
