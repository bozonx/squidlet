export default {
  config: {
    logLevel: 'info',
    defaultStatusRepublishIntervalMs: 60000,
    defaultConfigRepublishIntervalMs: 600000,
    senderTimeout: 60,
    senderResendTimeout: 3,
    drivers: {
      //defaultDigitalPinInputDebounce: 25,
      //defaultPollInterval: 300,
    },

    // TODO: review

    // default params for connections
    connections: {
      i2c: {
        pollInterval: 100,
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
