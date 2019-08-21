import EntityBase from './EntityBase';
import Sender from '../lib/Sender';


export default class DriverBase<Props extends {[index: string]: any} = any> extends EntityBase<Props> {
  readonly entityType = 'driver';

  // TODO: review - move to context
  protected newSender(): Sender {
    return new Sender(
      this.context.config.config.senderTimeout,
      this.context.config.config.senderResendTimeout
    );
  }

}
