import ServiceBase from 'system/base/ServiceBase';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionServiceType,
  IncomeMessageHandler,
  StatusHandler
} from 'system/interfaces/Connection';

import {
  SemiDuplexFeedback,
  SemiDuplexFeedbackBaseProps
} from '../../drivers/SemiDuplexFeedback/SemiDuplexFeedback';


interface Props extends SemiDuplexFeedbackBaseProps {
}


export default class ModbusConnection extends ServiceBase<Props> implements Connection {
  serviceType: ConnectionServiceType = CONNECTION_SERVICE_TYPE;

  private semiDuplexFeedback!: SemiDuplexFeedback;


  init = async () => {
    this.semiDuplexFeedback = await this.context.getSubDriver(
      'SemiDuplexFeedback',
      {
        // TODO: make feedbackId
        //feedbackId: `mbc${this.props.}`,
        pollIntervalMs: this.props.pollIntervalMs,
        int: this.props.int,
      }
    );
    this.semiDuplexFeedback = await this.context.getSubDriver(
      'ModbusMaster',
      {
        // TODO: make feedbackId
        //feedbackId: `mbc${this.props.}`,
        pollIntervalMs: this.props.pollIntervalMs,
        int: this.props.int,
      }
    );

    this.semiDuplexFeedback.startFeedback(this.feedbackHandler);
  }

  destroy = async () => {
  }


  /**
   * Send data to peer and don't wait for response.
   * Port is from 0 and up to 253. Don't use 254 and 255.
   */
  send(port: number, payload: Uint8Array): Promise<void> {

  }

  isConnected(): boolean {
    // TODO: add
  }

  onIncomeMessage(cb: IncomeMessageHandler): number {
    // TODO: add
  }

  onConnect(cb: StatusHandler): number {
    // TODO: add
  }

  onDisconnect(cb: StatusHandler): number {
    // TODO: add
  }

  /**
   * Remove listener of onIncomeData, onConnect or onDisconnect
   */
  removeListener(handlerIndex: number): void {
    // TODO: add
  }


  private feedbackHandler(): Promise<Uint8Array> {
    // TODO: add
  }

}
