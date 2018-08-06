import * as EventEmitter from 'events';
import Republish from './Republish';


export type ConfigGetter = () => Promise<void>;
export type ConfigSetter = () => Promise<void>;
// TODO: что должно быть???
type ChangeHandler = () => void;


export default class Config {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly republish: Republish;

  constructor(republishInterval: number, configGetter?: ConfigGetter, configSetter?: ConfigSetter) {
    this.republish = new Republish(republishInterval);
  }

  /**
   * Get whole config from device.
   */
  getConfig = async (): Promise<void> => {

  }

  /**
   * Set config to device
   */
  setConfig = async (partialConfig: {[index: string]: any}): Promise<void> => {
    // TODO: check types via schema
  }

  onChange(cb: ChangeHandler) {
    this.events.addListener('change', cb);
  }

  removeListener(cb: ChangeHandler) {
    this.events.removeListener('change', cb);
  }

}
