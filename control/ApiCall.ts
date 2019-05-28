import WsApiClient from '../shared/WsApiClient';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';


// TODO: remove
let uniqIdIndex = 0;


export interface ApiCallArgs {
  host?: string;
  port?: number;
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


  private generateUniqId = (): string => {

    // TODO: use real uniq id

    uniqIdIndex++;

    return String(uniqIdIndex);
  }

  private connect({host, port}: ApiCallArgs): WsApiClient {
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
