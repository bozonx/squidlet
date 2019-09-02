import {HostConfigConfig} from '../../system/interfaces/HostConfig';


const config: HostConfigConfig = {
  //defaultStatusRepublishIntervalMs: 60000,
  //defaultConfigRepublishIntervalMs: 600000,
  // timeout in seconds to send a request. It resend on failure or brake connection if timout is finished.
  senderTimeout: 60,
  senderResendTimeout: 1,
  rcResponseTimoutSec: 30,
  queueJobTimeoutSec: 120,

  // default params for connections
  // connections: {
  //   i2c: {
  //     pollInterval: 100,
  //   }
  // },
  // network: {
  //   routedMessageTTL: 10,
  //   // timeout of waiting of request has finished in ms
  //   requestTimeout: 60000,
  // },
};


export default {
  config,
  ioServer: {
    host: 'localhost',
    port: 8089
  },
};
