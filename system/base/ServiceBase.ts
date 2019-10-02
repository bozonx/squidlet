import EntityBase from './EntityBase';


export default class ServiceBase<Props extends {[index: string]: any} = {}> extends EntityBase<Props> {
  readonly entityType = 'service';
}
