import DriverFactoryBase from 'base/DriverFactoryBase';


interface I2cToMasterProps {
  bus: number;
}


export class I2cToMaster {
  // TODO: do it
}


export default class Factory extends DriverFactoryBase<I2cToMaster> {
  protected SubDriverClass = I2cToMaster;
  protected instanceId = (props: I2cToMasterProps) => String(props.bus);
}
