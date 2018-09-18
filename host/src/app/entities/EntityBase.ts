import EntityDefinition from '../interfaces/EntityDefinition';
import {DriversBase} from '../../baseDevice/DeviceBase';
import ManifestBase from '../interfaces/ManifestBase';
import Env from '../interfaces/Env';


export default class EntityBase<Props> {
  readonly id: string;
  readonly className: string;
  readonly props: Props;
  protected readonly env: Env;
  // it calls after device init, status and config init have been finished
  protected afterInit?: () => void;
  protected destroy?: () => void;
  protected driversInstances: DriversBase = {};

  // /**
  //  * Get driver which is dependency of device
  //  */
  // get drivers(): {[index: string]: DriverInstance} {
  //   return this.driversInstances;
  // }

  constructor(definition: EntityDefinition, env: Env) {
    this.env = env;
    this.id = definition.id;
    this.className = definition.className;
    this.props = definition.props as Props;
  }

  protected async initDependencies(manifest: ManifestBase): Promise<void> {
    //const manifest: DeviceManifest = await this.getManifest();

    // TODO: получить ссылки на зависимые драйвера

    if (this.afterInit) this.afterInit();
  }


  /**
   * Load manifest of this entity
   */
  async getManifest<T extends ManifestBase>(): Promise<T> {
    return await this.env.loadManifest(this.className) as T;
  }

}
