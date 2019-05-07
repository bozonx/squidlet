import BackdoorClient from './BackdoorClient';


// TODO: on control+C send removeListener ????


export default class RemoteEvents {
  async listenEvent(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);

    await (backdoorClient as any)['addListener'](args.category, args.topic, args.data);
  }

  async emitEvent(args: {[index: string]: any}) {
    if (!args.category) {
      throw new Error(`You have to specify a category`);
    }

    const backdoorClient = new BackdoorClient(args.host, args.port);

    await (backdoorClient as any)['emit'](args.category, args.topic, args.data);

    // exit
    backdoorClient.close();
  }

}
