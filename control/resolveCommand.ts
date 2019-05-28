import _omit = require('lodash/omit');
import * as yargs from 'yargs';

import CommandUpdate from './CommandUpdate';
import CommandStart from './CommandStart';
import ApiCall from './ApiCall';


const apiCall = new ApiCall();


async function startCommand(command: string, positionArgsRest: string[], args: {[index: string]: any}) {
  switch (command) {
    case 'start':
      return (new CommandStart(positionArgsRest, args as any)).start();
    case 'update':
      return (new CommandUpdate(positionArgsRest, args)).start();
    case 'log':
      return apiCall.listenLogs(args, args.level);
    case 'call':
      return apiCall.callMethod({ ...args, methodName: args.method, methodArgs: positionArgsRest });
    case 'block-io':
      return apiCall.callAndExit({ ...args, methodName: 'blockIo', methodArgs: [true] });
    default:
      console.error(`Unknown command "${command}"`);
      process.exit(2);
  }
}


export default async function resolveCommand() {
  const positionArgs: string[] = [ ...yargs.argv._ ];
  const args: {[index: string]: any} = _omit(yargs.argv, '_');

  if (!positionArgs || !positionArgs.length) {
    throw new Error(`You should specify a command`);
  }

  const command: string = positionArgs[0];
  const positionArgsRest: string[] = positionArgs.slice(1, positionArgs.length);

  await startCommand(command, positionArgsRest, args);
}
