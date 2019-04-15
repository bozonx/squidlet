import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';


export class I2cToMaster {
  // TODO: do it
}


export default class Factory extends DriverFactoryBase<I2cToMaster> {
  protected instanceByPropName = 'bus';
  protected DriverClass = I2cToMaster;
}
