import {
  BridgeConnectionState,
  BridgeDriver,
  IncomeMessageHandler
} from '../../interfaces/BridgeDriver'
import EntityBase from '../../../../base/EntityBase'


interface WsServerBridgeProps {

}


export class WsServerBridge extends EntityBase<WsServerBridgeProps> implements BridgeDriver {
  getConnectionState(): BridgeConnectionState {

  }

  sendMessage(channel: number, body: Uint8Array): Promise<void> {

  }

  onIncomeMessage(cb: IncomeMessageHandler): number {

  }

  onConnectionState(cb: (state: BridgeConnectionState) => void): number {

  }

  removeListener(handlerIndex: number): void {

  }

}
