import EntityBase from './EntityBase';
import Sender from '../../../squidlet-lib/src/Sender';


export default class DriverBase<Props extends {[index: string]: any} = any> extends EntityBase<Props> {
  readonly entityType = 'driver';
}
