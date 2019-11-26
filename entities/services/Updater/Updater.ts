import ServiceBase from 'system/base/ServiceBase';
import {EntityType} from 'system/interfaces/EntityTypes';


interface Props {
}


export default class Updater extends ServiceBase<Props> {
  async init() {
    this.context.system.apiManager.registerEndpoint('updater', this.updaterApi);
  }

  private updaterApi = {

  };

}
