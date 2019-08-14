import EntityBase from '../entities/EntityBase';
import Sender from '../lib/Sender';
import DriverManifest from '../interfaces/DriverManifest';


export default class DriverBase<Props extends {[index: string]: any} = any> extends EntityBase<Props> {
  async loadManifest(driverName: string): Promise<DriverManifest> {
    return this.context.system.envSet.loadManifest<DriverManifest>('drivers', driverName);
  }


  // TODO: review - move to context
  protected newSender(): Sender {
    return new Sender(
      this.context.config.config.senderTimeout,
      this.context.config.config.senderResendTimeout
    );
  }

}
