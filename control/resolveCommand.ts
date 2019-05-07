import _omit = require('lodash/omit');
import * as yargs from 'yargs';

import CommandUpdate from './CommandUpdate';
import CommandStart from './CommandStart';
import RemoteEvents from './RemoteEvents';


const remoteEvents = new RemoteEvents();


async function startCommand(command: string, positionArgsRest: string[], args: {[index: string]: any}) {
  switch (command) {
    case 'start':
      return (new CommandStart(positionArgsRest, args as any)).start();
    case 'update':
      return (new CommandUpdate(positionArgsRest, args)).start();
    case 'log':
      return remoteEvents.startListen({ ...args, category: 'logger', topic: undefined });
    case 'pub':
      return remoteEvents.emitAndExit(args);
    case 'sub':
      return remoteEvents.startListen(args);
    case 'block-io':
      // TODO: review
      return remoteEvents.emitAndExit({ ...args, category: 'system', topic: 'block-io' });
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
