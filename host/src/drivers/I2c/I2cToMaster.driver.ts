import DriverFactoryBase from '../../app/entities/DriverFactoryBase';


export class I2cToMasterDriver {

}


export default class Factory extends DriverFactoryBase<I2cToMasterDriver> {
  protected DriverClass = I2cToMasterDriver;

  // TODO: почему всегда новый инстанс, а не по address + bus ???

  protected instanceAlwaysNew = true;
}
