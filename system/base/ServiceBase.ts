import EntityBase from './EntityBase';
import ServiceManifest from '../interfaces/ServiceManifest';


export default class ServiceBase<Props extends {[index: string]: any;} = {}> extends EntityBase<Props> {
  readonly entityType = 'service';
}
