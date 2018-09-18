import DriverEnv from './DriverEnv';
import EntityDefinition from '../interfaces/EntityDefinition';
import DeviceManifest from '../interfaces/DeviceManifest';
import DriverManifest from '../interfaces/DriverManifest';


export default class DriverBase<Props> {
  readonly id: string;
  readonly className: string;
  readonly props: Props;
  protected readonly env: DriverEnv;
  // it calls after device init, status and config init have been finished
  protected afterInit?: () => void;

  constructor(definition: EntityDefinition, env: DriverEnv) {
    this.env = env;
    this.id = definition.id;
    this.className = definition.className;
    this.props = definition.props as Props;
  }

  async init(): Promise<void> {
    //const manifest: DeviceManifest = await this.getManifest();

    // TODO: получить ссылки на зависимые драйвера

    if (this.afterInit) this.afterInit();
  }


  /**
   * Load manifest of this driver
   */
  async getManifest(): Promise<DriverManifest> {
    return this.env.loadDriverManifest(this.className);
  }

}
