// See interface in squidlet/host/src/app/interfaces/dev/Gpio.dev.ts

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import DriverEnv from '../../../host/src/app/DriverEnv';
import DriverProps from '../../../host/src/app/interfaces/DriverProps';

export class GpioDev {

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: DriverEnv,
      driverProps: DriverProps,
    ): GpioDev } = GpioDev;
}
