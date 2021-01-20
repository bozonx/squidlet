import EntityBase from '../../../../base/EntityBase'


export type NetworkIncomeRequestHandler = (
  uri: string,
  payload: Uint8Array,
  fromHost: string,
  //fromConnectionId: string
) => void


export function encodeNetworkPayload(
  host: string,
  uri: string,
  payload: Uint8Array
): Uint8Array {

}

export default class Network extends EntityBase {
  private bridgesManager: BridgesManager
  private hostResolver: HostResolver


  async send(host: string, uri: string, payload: Uint8Array): Promise<void> {
    const connectionId: string = this.hostResolver.resoveConnection(host)
    const completePayload = encodeNetworkPayload(host, uri, payload)

    await this.bridgesManager.send(connectionId, completePayload)
  }

  onIncomeMessage(cb: NetworkIncomeRequestHandler): number {
    // TODO: add
  }

  off(handlerIndex: number) {
    // TODO: add
  }

}
