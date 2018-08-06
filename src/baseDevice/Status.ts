import * as EventEmitter from 'events';


export type StatusGetter = () => Promise<void>;
export type StatusSetter = () => Promise<void>;


/**
 * Manage local status
 */
export default class Status {
  private readonly events: EventEmitter = new EventEmitter();

  constructor(statusGetter?: StatusGetter, statusSetter?: StatusSetter) {

  }

  getStatus() {

  }

  setStatus() {
    // TODO: check types via schema
  }

  onChange() {

  }

  removeListener() {

  }

}
