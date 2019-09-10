import * as yargs from 'yargs';

import CommandUpdate from './CommandUpdate';
import CommandStart from './CommandStart';
import HttpApiCall from './HttpApiCall';
import WsApiCall from './WsApiCall';
import {omitObj} from '../system/lib/objects';


const httpApiCall = new HttpApiCall();
const wsApiCall = new WsApiCall();


async function startCommand(command: string, positionArgsRest: string[], args: {[index: string]: any}) {
  switch (command) {
    case 'start':
      return (new CommandStart(positionArgsRest, args as any)).start();
    case 'io-server':
      return (new CommandStart(positionArgsRest, args as any)).startIoServer();
    case 'update':
      return (new CommandUpdate(positionArgsRest, args)).start();
    case 'log':
      return wsApiCall.log(args.level, args.host, args.port);
    case 'action':
      return wsApiCall.action(
        positionArgsRest[0],
        positionArgsRest[1],
        positionArgsRest.slice(2),
        args.host,
        args.port
      );
    case 'status':
      return wsApiCall.status(positionArgsRest[0], args.host, args.port, args.watch);
    case 'config':
      return wsApiCall.config(positionArgsRest[0], args.host, args.port, args.watch);
    case 'state':
      return wsApiCall.state(positionArgsRest[0], positionArgsRest[1], args.host, args.port, args.watch);
    case 'reboot':
      return wsApiCall.reboot(args.host, args.port);
    case 'info':
      return httpApiCall.info(args.host, args.port);
    case 'switch-to-ioserver':
      return wsApiCall.switchToIoServer(args.host, args.port);
    default:
      console.error(`Unknown command "${command}"`);
      process.exit(2);
  }
}


export default async function resolveCommand() {
  const positionArgs: string[] = [ ...yargs.argv._ ];
  const args: {[index: string]: any} = omitObj(yargs.argv, '_');

  if (!positionArgs || !positionArgs.length) {
    throw new Error(`You should specify a command`);
  }

  const command: string = positionArgs[0];
  const positionArgsRest: string[] = positionArgs.slice(1, positionArgs.length);

  await startCommand(command, positionArgsRest, args);
}
