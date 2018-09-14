import System from '../../host/src/app/System';
import GpioDev from './dev/Gpio.dev';
import I2cMasterDev from './dev/I2cMaster.dev';
import FsDev from './dev/Fs.dev';


export default async function (): Promise<System> {
  const system: System = new System();

  await system.$registerDevs({
    'Gpio.dev': GpioDev,
    'I2cMaster.dev': I2cMasterDev,
    'Fs.dev': FsDev,
  });

  return system;
}
