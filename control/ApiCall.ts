import BackdoorClient from '../shared/BackdoorClient';
import {EventPayload} from '../__old/backdoor/MainEventsServer';
import WsApiClient from '../shared/WsApiClient';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';


export interface ApiCallArgs {
  host?: string;
  port?: number;
  methodName: string;
  methodArgs: any[];
}


export default class ApiCall {
  async callMethod(args: ApiCallArgs) {
    const apiClient = this.connect(args);

    await apiClient.callMethod(args.methodName, ...args.methodArgs);
  }


  async startListen(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);
    const payload: EventPayload = [ args.category, args.topic, undefined ];

    await backdoorClient.init();
    // Send intention to receive events
    await backdoorClient.send(BACKDOOR_ACTION.startListen, payload);

    // listen remote events
    backdoorClient.addListener(BACKDOOR_ACTION.listenerResponse, (payload: EventPayload) => {
      console.info(`${payload[0]}:${payload[1]} - ${payload[2]}`);
    });
  }

  async callAndExit(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);
    const payload: EventPayload = [ args.category, args.topic, args.data ];

    await backdoorClient.init();
    await backdoorClient.send(BACKDOOR_ACTION.emit, payload);

    // exit
    await backdoorClient.close();
  }


  private generateUniqId = (): string => {
    // TODO: !!!!
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
