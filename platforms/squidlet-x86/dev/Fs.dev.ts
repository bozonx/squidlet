// See interface in squidlet/host/src/app/interfaces/dev/Fs.dev.ts

import DriverFactoryBase from '../../../host/src/app/entities/DriverFactoryBase';
import DriverEnv from '../../../host/src/app/entities/DriverEnv';
import {EntityProps} from '../../../host/src/app/interfaces/EntityDefinition';
import {DigitalDev} from '../../squidlet-esp32/dev/Digital.dev';


export class FsDev {

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
    ): DigitalDev } = DigitalDev;
}
