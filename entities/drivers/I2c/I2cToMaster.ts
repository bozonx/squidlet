import DriverFactoryBase from 'host/baseDrivers/DriverFactoryBase';


export class I2cToMaster {

}


export default class Factory extends DriverFactoryBase<I2cToMaster> {
  protected instanceByPropName = 'bus';
  protected DriverClass = I2cToMaster;
}
