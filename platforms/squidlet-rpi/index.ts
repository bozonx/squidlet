import System from '../../host/src/app/System';

import GpioDev from './dev/Gpio.dev';
import I2cMasterDev from './dev/I2cMaster.dev';
import FsDev from './dev/Fs.dev';


async function init() {
  const system = new System();

  // TODO: может вынести в отдельный файлы чтобы можно было подключать в своем проекте

  system.driversManager.$setDevs({
    'Gpio.dev': GpioDev,
    'I2cMaster.dev': I2cMasterDev,
    'Fs.dev': FsDev,
  });

  await system.start();
}

init()
  .catch((err) => {
    console.error(err.toString());

    throw err;
  });
