import {BACKDOOR_ACTION} from '../entities/services/Backdoor/Backdoor';
import BackdoorClient from '../shared/BackdoorClient';
import {EventPayload} from '../entities/services/Backdoor/MainEventsServer';


export default class RemoteEvents {
  async startListen(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);
    const payload: EventPayload = [ args.category, args.topic, undefined ];

    // Send intention to receive events
    await backdoorClient.send(BACKDOOR_ACTION.startListen, payload);

    // listen remote events
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
