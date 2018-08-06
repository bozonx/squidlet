import * as EventEmitter from 'events';
import Republish from './Republish';


export type StatusGetter = (statusName: string) => Promise<any>;
export type StatusSetter = (newValue: any, statusName: string) => Promise<void>;
// TODO: что должно быть???
type ChangeHandler = () => void;


/**
 * Manage local status
 */
export default class Status {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly republish: Republish;
  // TODO: нужно ли указывать тип?
  private readonly localCache: {[index: string]: any} = {};
  private readonly statusGetter?: StatusGetter;
  private readonly statusSetter?: StatusSetter;

  constructor(republishInterval: number, statusGetter?: StatusGetter, statusSetter?: StatusSetter) {
    this.statusGetter = statusGetter;
    this.statusSetter = statusSetter;
    this.republish = new Republish(republishInterval);
  }

  /**
   * Get status from device.
   */
  getStatus = async (statusName: string = 'default'): Promise<void> => {
    if (this.statusGetter) {

    }
  }

  /**
   * Set status of device.
   */
  setStatus = async (newValue: any, statusName: string = 'default'): Promise<void> => {
    // TODO: check types via schema
  }

  onChange(cb: ChangeHandler) {
    this.events.addListener('change', cb);
  }

  removeListener(cb: ChangeHandler) {
    this.events.removeListener('change', cb);
  }

}
