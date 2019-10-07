import DriverFactoryBase from 'system/base/DriverFactoryBase';


export class I2cToMaster {
  // TODO: do it
}


export default class Factory extends DriverFactoryBase<I2cToMaster> {
  protected instanceByPropName = 'bus';
  protected SubDriverClass = I2cToMaster;
}
