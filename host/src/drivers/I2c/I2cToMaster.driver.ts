import DriverFactoryBase from '../../app/entities/DriverFactoryBase';


export class I2cToMasterDriver {

}


export default class Factory extends DriverFactoryBase<I2cToMasterDriver> {
  protected instanceByPropName = 'bus';
  protected DriverClass = I2cToMasterDriver;
}
