import * as EventEmitter from 'events';
import Republish from './Republish';
import {StatusGetter, StatusSetter} from './Status';


export type ConfigGetter = () => Promise<void>;
export type ConfigSetter = (partialConfig: {[index: string]: any}) => Promise<void>;
// TODO: что должно быть???
type ChangeHandler = () => void;


export default class Config {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly republish: Republish;
  // TODO: нужно ли указывать тип?
  private readonly localCache: {[index: string]: any} = {};
  private readonly configGetter?: ConfigGetter;
  private readonly configSetter?: ConfigSetter;

  constructor(republishInterval: number, configGetter?: ConfigGetter, configSetter?: ConfigSetter) {
    this.configGetter = configGetter;
    this.configSetter = configSetter;
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
    // TODO: нужно ли указывать тип?
  }

  onChange(cb: ChangeHandler) {
    this.events.addListener('change', cb);
  }

  removeListener(cb: ChangeHandler) {
    this.events.removeListener('change', cb);
  }

}
