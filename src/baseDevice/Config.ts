import * as _ from 'lodash';
import * as EventEmitter from 'events';
import Republish from './Republish';
import {Publisher} from './DeviceBase';


// TODO: нужно ли указывать тип?
type DeviceConfig = {[index: string]: any};
export type ConfigGetter = () => Promise<DeviceConfig>;
export type ConfigSetter = (partialConfig: DeviceConfig) => Promise<void>;
type ChangeHandler = (config: DeviceConfig) => void;

const ChangeEventName = 'change';


export default class Config {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly republish: Republish;
  private localCache: DeviceConfig = {};
  private readonly publish?: Publisher;
  private readonly configGetter?: ConfigGetter;
  private readonly configSetter?: ConfigSetter;

  constructor(
    republishInterval: number,
    publish: Publisher,
    configGetter?: ConfigGetter,
    configSetter?: ConfigSetter
  ) {
    this.publish = publish;
    this.configGetter = configGetter;
    this.configSetter = configSetter;
    this.republish = new Republish(republishInterval);
  }

  init(): Promise<void> {
    // TODO: initialize - get values
  }

  /**
   * Get whole config from device.
   */
  getConfig = async (): Promise<DeviceConfig> => {
    // TODO: если запрос статуса в процессе - то не делать новый запрос, а ждать пока пройдет текущий запрос
       // установить в очередь следующий запрос и все новые запросы будут получать результат того что в очереди

    // TODO: писать в лог при ошибке

    const oldConfig = this.localCache;

    // update local cache if configGetter is defined
    if (this.configGetter) {
      this.localCache = await this.configGetter();

      if (!_.isEqual(oldConfig, this.localCache)) {
        // TODO: call republish
        this.events.emit(ChangeEventName, this.localCache);
      }
    }

    return this.localCache;
  }

  /**
   * Set config to device
   */
  setConfig = async (partialConfig: DeviceConfig): Promise<void> => {
    // TODO: check types via schema

    // TODO: если запрос установки статуса в процессе - то дождаться завершения и сделать новый запрос,
      // при этом в очереди может быть только 1 запрос - самый последний

    // TODO: писать в лог при ошибке

    const oldConfig = this.localCache;

    const newConfig = {
      ...this.localCache,
      ...partialConfig,
    };

    if (this.configSetter) {
      await this.configSetter(newConfig);
    }

    // TODO: что будет со значение которое было установленно в промежутке пока идет запрос и оно отличалось от старого???

    this.localCache = newConfig;

    if (!_.isEqual(oldConfig, newConfig)) {
      // TODO: call republish
      this.events.emit(ChangeEventName, newConfig);
    }
  }

  onChange(cb: ChangeHandler) {
    this.events.addListener(ChangeEventName, cb);
  }

  removeListener(cb: ChangeHandler) {
    this.events.removeListener(ChangeEventName, cb);
  }

}
