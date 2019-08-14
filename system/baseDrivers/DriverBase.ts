import EntityBase from '../entities/EntityBase';
import EntityDefinition from '../interfaces/EntityDefinition';
import Sender from '../lib/Sender';
import DriverManifest from '../interfaces/DriverManifest';
import EntityEnv from '../entities/EntityEnv';


export default class DriverBase<Props extends {[index: string]: any} = any> extends EntityBase<Props> {
  protected readonly env: EntityEnv;

  constructor(definition: EntityDefinition, env: EntityEnv) {
    super(definition, env);
    this.env = env;
  }


  async loadManifest(driverName: string): Promise<DriverManifest> {
    return this.system.envSet.loadManifest<DriverManifest>('drivers', driverName);
  }


  // TODO: review
  protected newSender(): Sender {
    return new Sender(
      this.env.config.config.senderTimeout,
      this.env.config.config.senderResendTimeout
    );
  }

}
