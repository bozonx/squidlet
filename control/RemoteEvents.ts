import BackdoorClient from './BackdoorClient';


// TODO: on control+C send removeListener ????


export default class RemoteEvents {
  async startListen(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);

    await backdoorClient.addListener(args.category, args.topic);
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
