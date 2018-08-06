import * as EventEmitter from 'events';
import Republish from './Republish';


export type StatusGetter = () => Promise<void>;
export type StatusSetter = () => Promise<void>;
// TODO: что должно быть???
type ChangeHandler = () => void;


/**
 * Manage local status
 */
export default class Status {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly republish: Republish;

  constructor(republishInterval: number, statusGetter?: StatusGetter, statusSetter?: StatusSetter) {
    this.republish = new Republish(republishInterval);
  }

  async getStatus(): Promise<void> {

  }

  async setStatus(): Promise<void> {
    // TODO: check types via schema
  }

  onChange(cb: ChangeHandler) {
    this.events.addListener('change', cb);
  }

  removeListener(cb: ChangeHandler) {
    this.events.removeListener('change', cb);
  }

}
