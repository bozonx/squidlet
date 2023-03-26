import EntityBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/EntityBase.js';
import Sender from '../../../../squidlet-lib/src/Sender';


// TODO: remove

export default class DriverBase<Props extends {[index: string]: any} = any> extends EntityBase<Props> {
  readonly entityType = 'driver';
}
