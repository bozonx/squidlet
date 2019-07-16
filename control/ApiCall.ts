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

    const result = await apiClient.callMethod('callDeviceAction', actionName, ...args);

    console.info(JSON.stringify(result));
  }

  async status(deviceId: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);

    if (watch) {
      // TODO: !!!
    }
    else {
      const result = await apiClient.callMethod('getDeviceStatus');

      console.info(JSON.stringify(result));
    }
  }

  async config(deviceId: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);

    if (watch) {
      // TODO: !!!
    }
    else {
      const result = await apiClient.callMethod('getDeviceConfig');

      console.info(JSON.stringify(result));
    }
  }

  async state(category: string, stateName: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);

    // TODO: !!!
  }

  async hostConfig(host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);

    const result = await apiClient.callMethod('getHostConfig');

    console.info(JSON.stringify(result));
  }

  async hostInfo(host?: string, port?: string, watch?: boolean) {
    const apiClient = this.connect(host, port);

    const result =  await apiClient.callMethod('getHostInfo');

    console.info(JSON.stringify(result));
    // await apiClient.close();
  }

  // TODO: review
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
