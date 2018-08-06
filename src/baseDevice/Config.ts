import * as EventEmitter from 'events';


export type ConfigGetter = () => Promise<void>;
export type ConfigSetter = () => Promise<void>;


export default class Config {
  private readonly events: EventEmitter = new EventEmitter();

  constructor(configGetter?: ConfigGetter, configSetter?: ConfigSetter) {

  }

  getConfig() {

  }

  setConfig() {
    // TODO: check types via schema
  }

  onChange() {

  }

  removeListener() {

  }

}
