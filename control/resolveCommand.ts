import _omit = require('lodash/omit');
import * as yargs from 'yargs';

import CommandUpdate from './CommandUpdate';
import CommandStart from './CommandStart';
import RemoteEvents from './RemoteEvents';


const remoteEvents = new RemoteEvents();


async function startCommand(command: string, positionArgsRest: string[], args: {[index: string]: any}) {
  if (command === 'start') {
    const commandUpdate: CommandStart = new CommandStart(positionArgsRest, args as any);

    return commandUpdate.start();
  }
  else if (command === 'update') {
    const commandUpdate: CommandUpdate = new CommandUpdate(positionArgsRest, args);

    return commandUpdate.start();
  }
  else if (command === 'log') {
    await remoteEvents.listenEvent({ ...args, category: 'logger', topic: undefined });
  }
  else if (command === 'pub') {
    await remoteEvents.emitEvent(args);
  }
  else if (command === 'sub') {
    await remoteEvents.listenEvent(args);
  }
  else if (command === 'block-io') {
    // TODO: review
    await remoteEvents.emitEvent({ ...args, category: 'system', topic: 'block-io' });
  }
  // else if (command === 'io-server') {
  //   const commandUpdate: CommandIoServer = new CommandIoServer(positionArgsRest, args);
  //
  //   return commandUpdate.start();
  // }

  console.error(`Unknown command "${command}"`);
  process.exit(2);
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
