export enum BRIDGE_MANAGER_EVENTS {
  incomeRequest,
  incomeSuccessResponse,
  incomeErrorResponse
}


export class BridgesManager {
  async sendRequest() {

  }

  async sendSuccessResponse() {

  }

  async sendErrorResponse() {

  }

  on(eventName: BRIDGE_MANAGER_EVENTS, cb: (...params: any[]) => void) {

  }

  once(eventName: BRIDGE_MANAGER_EVENTS, cb: (...params: any[]) => void) {

  }

  off() {

  }

}
