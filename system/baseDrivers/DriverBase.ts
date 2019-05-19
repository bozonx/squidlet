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

  // TODO: review
  protected newSender(): Sender {
    return new Sender(
      this.env.config.config.senderTimeout,
      this.env.config.config.senderResendTimeout
    );
  }

}
