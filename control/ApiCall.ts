import WsApiClient from '../shared/WsApiClient';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';


// TODO: remove
let uniqIdIndex = 0;


interface ApiConnectionParams {
  host?: string;
  port?: number;
}

export interface ApiCallArgs extends ApiConnectionParams {
  methodName: string;
  methodArgs?: any[];
}


export default class ApiCall {
  async callMethod(args: ApiCallArgs) {
    const apiClient = this.connect(args);

    await apiClient.callMethod(args.methodName, ...args.methodArgs);
  }

  async callAndExit(args: ApiCallArgs) {
    const apiClient = this.connect(args);

    await apiClient.callMethod(args.methodName, ...args.methodArgs);
    await apiClient.close();
  }

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

  private connect({host, port}: ApiConnectionParams): WsApiClient {
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
