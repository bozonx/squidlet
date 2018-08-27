import System from '../../host/src/app/System';

import GpioDev from './dev/Gpio.dev';
import I2cMasterDev from './dev/I2cMaster.dev';
import I2cSlaveDev from './dev/I2cSlave.dev';
import StorageDev from './dev/Storage.dev';


async function init() {
  const system = new System();

  system.drivers.$setDevs({
    'Gpio.dev': GpioDev,
    'I2cMaster.dev': I2cMasterDev,
    'I2cSlave.dev': I2cSlaveDev,
    'Storage.dev': StorageDev,
  });

  await system.start();
}

init()
  .catch((err) => {
    throw new Error(err);
  });
