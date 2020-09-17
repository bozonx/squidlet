import ServiceBase from 'system/base/ServiceBase';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionServiceType, ConnectionsEvents,
  IncomeMessageHandler,
  StatusHandler
} from 'system/interfaces/Connection';
import {uint8ToUint16} from 'system/lib/binaryHelpers';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';

import {
  SemiDuplexFeedback,
  SemiDuplexFeedbackBaseProps
} from '../../drivers/SemiDuplexFeedback/SemiDuplexFeedback';
import {
  ModbusMaster,
  ModbusMasterDriverProps
} from '../../drivers/ModbusMaster/ModbusMaster';
import PollOnceModbus from './PollOnceModbus';


interface Props extends SemiDuplexFeedbackBaseProps, ModbusMasterDriverProps {
}

// TODO: use Sender ???

export default class ModbusMasterConnection extends ServiceBase<Props> implements Connection {
  serviceType: ConnectionServiceType = CONNECTION_SERVICE_TYPE;

  private events = new IndexedEventEmitter();
  private semiDuplexFeedback!: SemiDuplexFeedback;
  private modbusMaster!: ModbusMaster;
  private pollOnce!: PollOnceModbus;


  init = async () => {
    this.semiDuplexFeedback = await this.context.getSubDriver(
      'SemiDuplexFeedback',
      {
        pollIntervalMs: this.props.pollIntervalMs,
        int: this.props.int,
        // TODO: make feedbackId
        //feedbackId: `mbc${this.props.}`,
        compareResult: false,
      }
    );
    this.modbusMaster = await this.context.getSubDriver(
      'ModbusMaster',
      {
        portNum: this.props.portNum,
        slaveId: this.props.slaveId,
      }
    );
    this.pollOnce = new PollOnceModbus(this.modbusMaster, this.log.warn);

    this.semiDuplexFeedback.startFeedback(this.feedbackHandler);
    this.pollOnce.addEventListener(this.handleIncomeMessage);
    //this.semiDuplexFeedback.addListener(this.handleIncomeData);

    // TODO: когда поднимать события connected|disconnected ????
  }

  destroy = async () => {
    this.events.destroy();
  }


  /**
   * Send data to peer and don't wait for response.
   * Port is from 0 and up to 253. Don't use 254 and 255.
   */
  async send(channel: number, payload: Uint8Array): Promise<void> {
    const data8Bit = new Uint8Array([
      channel,
      ...payload,
    ]);

    await this.modbusMaster.writeMultipleRegisters(0, uint8ToUint16(data8Bit));
  }

  isConnected(): boolean {
    // TODO: add
    return true;
  }

  onIncomeMessage(cb: IncomeMessageHandler): number {
    return this.events.addListener(ConnectionsEvents.message, cb);
  }

  onConnect(cb: StatusHandler): number {
    return this.events.addListener(ConnectionsEvents.connected, cb);
  }

  onDisconnect(cb: StatusHandler): number {
    return this.events.addListener(ConnectionsEvents.disconnected, cb);
  }

  /**
   * Remove listener of onIncomeData, onConnect or onDisconnect
   */
  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }


  // TODO: проверить что будет гарантированно дожидаться результата и не будет
  //       делаться других запросов
  private async feedbackHandler(): Promise<Uint8Array | undefined> {
    await this.pollOnce.pollOnce();

    return;
  }

  private handleIncomeMessage(channel: number, payload: Uint8Array) {
    this.events.emit(ConnectionsEvents.message, channel, payload);
  }

}
