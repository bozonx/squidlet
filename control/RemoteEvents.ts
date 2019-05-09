import BackdoorClient from '../shared/BackdoorClient';
import {BACKDOOR_ACTION, BackdoorMessage} from '../entities/services/Backdoor/Backdoor';


export default class RemoteEvents {
  async startListen(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);

    backdoorClient.onIncomeMessage((message: BackdoorMessage) => {
      // print only data which is send on previously added listener
      if (message.action !== BACKDOOR_ACTION.listenerResponse) return;

      console.info(`${message.payload.category}:${message.payload.topic} - ${message.payload.data}`);
    });

    // TODO: on ctl + C - call destroy of backdoorClient
  }

  async emitAndExit(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);

    await backdoorClient.emit(args.category, args.topic, args.data);

    // exit
    backdoorClient.close();
  }

}
