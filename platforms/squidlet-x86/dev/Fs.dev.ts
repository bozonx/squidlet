// See interface in squidlet/host/src/app/interfaces/dev/Fs.dev.ts

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import DriverEnv from '../../../host/src/app/DriverEnv';
import DriverProps from '../../../host/src/app/interfaces/DriverProps';

export class FsDev {

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      driverEnv: DriverEnv,
      driverProps: DriverProps,
    ): FsDev } = FsDev;
}
