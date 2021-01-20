import EntityBase from '../../../../base/EntityBase'


export type NetworkIncomeRequestHandler = (
  uri: string,
  payload: Uint8Array,
  fromHost: string
) => void


export default class Network extends EntityBase {

  async request(host: string, uri: string, payload: Uint8Array): Promise<Uint8Array> {
    // TODO: add
  }

  onIncomeRequest(cb: NetworkIncomeRequestHandler): number {
    // TODO: add
  }

  off(handlerIndex: number) {
    // TODO: add
  }

}
