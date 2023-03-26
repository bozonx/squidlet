import * as yargs from 'yargs';

import CommandUpdate from '../../../../../../../mnt/disk2/workspace/squidlet/__old/control/CommandUpdate.js';
import CommandStart from '../../../../../../../mnt/disk2/workspace/squidlet/__old/control/CommandStart.js';
import HttpApiCall from '../../../../../../../mnt/disk2/workspace/squidlet/__old/control/HttpApiCall.js';
import WsApiCall from '../../../../../../../mnt/disk2/workspace/squidlet/__old/control/WsApiCall.js';
import {omitObj} from '../../../squidlet-lib/src/objects';


const httpApiCall = new HttpApiCall();
const wsApiCall = new WsApiCall();


async function startCommand(command: string, positionArgsRest: string[], args: {[index: string]: any}) {
  switch (command) {
    case 'start':
      if (args.prod) {
        return (new CommandStart(positionArgsRest, args as any)).startProd();
      }
      else if (args.ioset) {
        return (new CommandStart(positionArgsRest, args as any)).startDevRemote(args.ioset);
      }
      else {
        return (new CommandStart(positionArgsRest, args as any)).startDevSrc();
      }
    case 'io-server':
      return (new CommandStart(positionArgsRest, args as any)).startIoServer();
    case 'update':
      return (new CommandUpdate(positionArgsRest, args)).start();
    case 'log':
      return wsApiCall.log(args.level, args.host, args.port);
    case 'action':
      return httpApiCall.action(
        positionArgsRest[0],
        positionArgsRest[1],
        positionArgsRest.slice(2),
        args.host,
        args.port
      );
    case 'status':
      if (args.watch) {
        return wsApiCall.watchStatus(positionArgsRest[0], args.host, args.port);
      }
      else {
        return httpApiCall.getStatus(positionArgsRest[0], args.host, args.port);
      }
    case 'config':
      if (args.watch) {
        return wsApiCall.watchConfig(positionArgsRest[0], args.host, args.port);
      }
      else {
        return httpApiCall.getConfig(positionArgsRest[0], args.host, args.port);
      }
    case 'state':
      if (args.watch) {
        return wsApiCall.watchState(positionArgsRest[0], positionArgsRest[1], args.host, args.port);
      }
      else {
        return httpApiCall.getState(Number(positionArgsRest[0]), positionArgsRest[1], args.host, args.port);
      }
    case 'reboot':
      return httpApiCall.reboot(args.host, args.port);
    case 'info':
      return httpApiCall.info(args.host, args.port);
    case 'switch-app':
      return httpApiCall.switchApp(positionArgsRest[0] as any, args.host, args.port);
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
