// See interface in squidlet/host/src/app/interfaces/dev/Gpio.dev.ts

import DriverFactoryBase from '../../../host/src/app/entities/DriverFactoryBase';
import DriverEnv from '../../../host/src/app/entities/DriverEnv';
import {EntityProps} from '../../../host/src/app/interfaces/EntityDefinition';


export class GpioDev {

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
    ): GpioDev } = GpioDev;
}
