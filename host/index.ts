/**
 * MainHostsEnv file which starts on microController's system boot.
 */

// Import helpers which will copy to final tree
import './helpers/binaryHelpers';
import './helpers/DebounceCall';
import './helpers/mkdirPLogic';
import './helpers/Polling';
import './helpers/Republish';
import './helpers/Sender';
import './helpers/typesHelpers';
import './helpers/validators';
// Import entities base which will copy to final tree
import './baseDevice/DeviceBase';
import './baseDrivers/DriverBase';
import './baseDrivers/DriverFactoryBase';
import './baseDrivers/MasterSlaveBaseNodeDriver';
import './baseServices/ServiceBase';

import System from './System';


// TODO: not read devset
const devSet = {};

const system = new System(devSet);

system.start()
  .catch((err: Error) => {
    console.log(`Uncaught error: ${String(err)}`);
  });
