import EntityBase from '../../../../base/EntityBase'


export type NetworkIncomeRequestHandler = (
  fromHost: string,
  uri: string,
  payload: Uint8Array
) => void


export default class Network extends EntityBase {

  async request(host: string, uri: string, payload: Uint8Array): Promise<Uint8Array> {

  }

  onIncomeRequest(cb: NetworkIncomeRequestHandler): number {
    // TODO: add
  }

  off(handlerIndex: number) {
    // TODO: add
  }

}
