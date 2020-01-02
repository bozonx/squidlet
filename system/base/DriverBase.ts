import EntityBase from './EntityBase';
import Sender from '../lib/Sender';


export default class DriverBase<Props extends {[index: string]: any} = any> extends EntityBase<Props> {
  readonly entityType = 'driver';
}
