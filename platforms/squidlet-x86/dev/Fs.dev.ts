// See interface in squidlet/host/src/app/interfaces/dev/Fs.dev.ts

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import DriverEnv from '../../../host/src/app/DriverEnv';
import {EntityProps} from '../../../host/src/app/interfaces/EntityDefinition';
import {GpioDev} from '../../squidlet-esp32/dev/Gpio.dev';
//import DriverProps from '../../../host/src/app/interfaces/DriverProps';

export class FsDev {

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
    ): GpioDev } = GpioDev;
}
