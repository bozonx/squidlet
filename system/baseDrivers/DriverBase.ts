import EntityBase from '../entities/EntityBase';
import EntityDefinition from '../interfaces/EntityDefinition';
import DriverEnv from './DriverEnv';
import Sender from '../helpers/Sender';


export default class DriverBase<Props = {}> extends EntityBase<Props> {
  protected readonly env: DriverEnv;

  constructor(definition: EntityDefinition, env: DriverEnv) {
    super(definition, env);
    this.env = env;
  }

  protected newSender(): Sender {
    return new Sender(
      // TODO: don't use system.host
      this.env.system.host.config.config.senderTimeout,
      this.env.system.host.config.config.senderResendTimeout
    );
  }

}
