export enum BRIDGE_MANAGER_EVENTS {
  incomeRequest,
  incomeSuccessResponse,
  incomeErrorResponse
}


export class BridgesManager {
  async sendRequest(connectionId: string, payload: Uint8Array) {

  }

  async sendSuccessResponse(connectionId: string, payload: Uint8Array) {

  }

  async sendErrorResponse(connectionId: string, payload: Uint8Array) {

  }

  on(eventName: BRIDGE_MANAGER_EVENTS, cb: (...params: any[]) => void) {

  }

  once(eventName: BRIDGE_MANAGER_EVENTS, cb: (...params: any[]) => void) {

  }

  off() {

  }

}
