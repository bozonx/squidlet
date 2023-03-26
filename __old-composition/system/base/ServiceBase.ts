import EntityBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/EntityBase.js';


export default class ServiceBase<Props extends {[index: string]: any} = {}> extends EntityBase<Props> {
  readonly entityType = 'service';
}
