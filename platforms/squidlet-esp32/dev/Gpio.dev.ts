// See interface in squidlet/host/src/app/interfaces/dev/Gpio.dev.ts

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import Drivers from '../../../host/src/app/Drivers';
import DriverProps from '../../../host/src/app/interfaces/DriverProps';

export class GpioDev {

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverProps: DriverProps,
    ): GpioDev } = GpioDev;
}
