import WsApiClient from '../shared/WsApiClient';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';


// TODO: remove
let uniqIdIndex = 0;


// interface ApiConnectionParams {
//   host?: string;
//   port?: number;
// }
//
// export interface ApiCallArgs extends ApiConnectionParams {
//   methodName: string;
//   methodArgs?: any[];
// }


export default class ApiCall {
  async action(deviceId: string, actionName: string, args: string[], host?: string, port?: string) {
    const apiClient = this.connect(host, port);

    await apiClient.callMethod('callDeviceAction', actionName, ...args);
  }

  async status(deviceId: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);
    // TODO: !!!
  }

  async config(deviceId: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);
    // TODO: !!!
  }

  async state(category: string, stateName: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);
    // TODO: !!!
  }

  async hostConfig(host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);
    // TODO: !!!
  }

  async hostInfo(host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);
    // TODO: !!!
  }

  // async callMethod(args: ApiCallArgs) {
  //   const apiClient = this.connect(args);
  //
  //   await apiClient.callMethod(args.methodName, ...args.methodArgs);
  // }

  // async callAndExit(args: ApiCallArgs) {
  //   const apiClient = this.connect(args);
  //
  //   await apiClient.callMethod(args.methodName, ...args.methodArgs);
  //   await apiClient.close();
  // }

  async listenLogs(args: ApiConnectionParams, level?: string) {
    const apiClient = this.connect(args);

    await apiClient.callMethod('listenLog', level, (message: string) => {
      console.log(message);
    });
  }


  private generateUniqId = (): string => {

    // TODO: use real uniq id

    uniqIdIndex++;

    return String(uniqIdIndex);
  }

  private connect(host?: string, port?: string): WsApiClient {
    return new WsApiClient(
      hostDefaultConfig.config.ioSetResponseTimoutSec,
      console.info,
      console.error,
      this.generateUniqId,
      host,
      port
    );
  }
}
