import {BACKDOOR_ACTION, BackdoorMessage, EventPayload} from '../entities/services/Backdoor/Backdoor';
import BackdoorClient from '../shared/BackdoorClient';


export default class RemoteEvents {
  async startListen(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);

    //const listenerId = 0;
    // const binMsg: Uint8Array = makeMessage(BACKDOOR_MSG_TYPE.send, BACKDOOR_ACTION.addListener, listenerId);
    //
    // // Send intention to receive events
    // await this.client.send(binMsg);

    backdoorClient.addListener(BACKDOOR_ACTION.listenerResponse, (payload: EventPayload) => {
      console.info(`${payload[0]}:${payload[1]} - ${payload[2]}`);
    });
  }

  async emitAndExit(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);
    const payload: EventPayload = [ args.category, args.topic, args.data ];

    await backdoorClient.send(BACKDOOR_ACTION.emit, payload);

    // exit
    backdoorClient.close();
  }

}
