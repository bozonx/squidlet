import {HostConfigConfig} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/HostConfig.js';


const config: HostConfigConfig = {
  //defaultStatusRepublishIntervalMs: 60000,
  //defaultConfigRepublishIntervalMs: 600000,
  // timeout in seconds to send a request. It resend on failure or brake connection if timout is finished.
  connectionTimeoutSec: 20,
  requestTimeoutSec: 60,
  // TODO: remove
  senderResendTimeout: 1,

  rcResponseTimoutSec: 30,
  responseTimoutSec: 10,
  queueJobTimeoutSec: 120,
  rebootDelaySec: 5,
  // TTL for network, max 255
  defaultTtl: 10,

  reconnectTimes: 60,
  reconnectTimeoutSec: 1,

  //appSwitchLock: false,
  // default params for connections
  // connections: {
  //   i2c: {
  //     defaultPollIntervalMs: 100,
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
};
