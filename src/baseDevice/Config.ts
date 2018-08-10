import DeviceDataManagerBase, {Data, Getter, Setter} from './DeviceDataManagerBase';


// TODO: наверное массив измененных параметров
type ChangeHandler = () => void;
export type Setter = Setter;
export type Getter = Getter;


/**
 * Manage config of device
 */
export default class Config extends DeviceDataManagerBase {
  protected readonly getter?: Getter;

  onChange(cb: ChangeHandler): void {
    super.onChange(cb);
  }

  removeListener(cb: ChangeHandler) {
    super.removeListener(cb);
  }

  /**
   * Get whole config from device.
   */
  read = async (): Promise<Data> => {
    const getter = async () => this.getter && await this.getter() || {};

    return this.readAllData('config', getter, () => {
      // TODO: нужно ли устанавливать параметры publish?
      this.publish('config', this.localData);
    });
  }

  /**
   * Set config to device
   */
  write = async (partialData: Data): Promise<void> => {
    return this.writeData('status', partialData, () => {
      // TODO: нужно ли устанавливать параметры publish?
      this.publish('config', this.localData);
    });
  }

}
