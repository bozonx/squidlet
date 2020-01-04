import NetworkDriverBase from 'system/lib/base/NetworkDriverBase';
import NetworkDriver, {
  NetworkDriverProps,
  NetworkRequest,
  NetworkResponse,
} from 'system/interfaces/NetworkDriver';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import { hexNumToString } from 'system/lib/binaryHelpers';
import {
  COMMANDS,
  deserializeRequest,
  deserializeResponse,
  MESSAGE_POSITION,
  REQUEST_PAYLOAD_START,
} from 'system/lib/networkHelpers';
import {Serial} from '../Serial/Serial';


export interface SerialNetworkProps extends NetworkDriverProps {
}


export class SerialNetwork extends NetworkDriverBase<SerialNetworkProps> implements NetworkDriver {
  private get serial(): Serial {
    return this.depsInstances.serial as any;
  }


  init = async () => {
    this.depsInstances.serial = this.context.getSubDriver('Serial', {
      portNum: this.props.busId,
    });

    this.serial.onMessage(this.handleIncomeMessage);
  }


  protected write(data: Uint8Array): Promise<void> {
    return this.serial.write(data);
  }


  /**
   * Handle income message and deserialize it.
   * @param data
   */
  private handleIncomeMessage(data: string | Uint8Array) {
    if (!(data instanceof Uint8Array)) {
      return this.log.error(`SerialNetwork: income data has to be Uint8Array`);
    }

    super.handleIncomeMessage(data);
  }

}


export default class Factory extends DriverFactoryBase<SerialNetwork, SerialNetworkProps> {
  protected SubDriverClass = SerialNetwork;
  protected instanceId = (props: SerialNetworkProps): string => String(props.busId);
}
