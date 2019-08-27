import * as yargs from 'yargs';

import CommandUpdate from './CommandUpdate';
import CommandStart from './CommandStart';
import ApiCall from './ApiCall';
import {omitObj} from '../system/lib/objects';


const apiCall = new ApiCall();


async function startCommand(command: string, positionArgsRest: string[], args: {[index: string]: any}) {
  switch (command) {
    case 'start':
      return (new CommandStart(positionArgsRest, args as any)).start();
    case 'io-server':
      return (new CommandStart(positionArgsRest, args as any)).startIoServer();
    case 'update':
      return (new CommandUpdate(positionArgsRest, args)).start();
    case 'log':
      return apiCall.log(args.level, args.host, args.port);
    case 'action':
      return apiCall.action(
        positionArgsRest[0],
        positionArgsRest[1],
        positionArgsRest.slice(2),
        args.host,
        args.port
      );
    case 'status':
      return apiCall.status(positionArgsRest[0], args.host, args.port, args.watch);
    case 'config':
      return apiCall.config(positionArgsRest[0], args.host, args.port, args.watch);
    case 'state':
      return apiCall.state(positionArgsRest[0], positionArgsRest[1], args.host, args.port, args.watch);
    case 'reboot':
      return apiCall.reboot(args.host, args.port);
    case 'info':
      return apiCall.hostInfo(args.host, args.port);
    case 'switch-to-ioserver':
      return apiCall.switchToIoServer(args.host, args.port);
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
