import _omit = require('lodash/omit');
import * as yargs from 'yargs';

import CommandUpdate from './CommandUpdate';
import CommandStart from './CommandStart';
import BackdoorClient from './BackdoorClient';


/**
 * Call pub/sub method on backdoor client
 */
async function backdoorEvent(method: string, args: {[index: string]: any}) {
  const backdoorClient = new BackdoorClient(args.host, args.port);

  if (!args.category) {
    throw new Error(`You have to specify a category`);
  }

  await (backdoorClient as any)[method](args.category, args.topic, args.data);
}


export default async function resolveCommand() {
  const positionArgs: string[] = [ ...yargs.argv._ ];
  const args: {[index: string]: any} = _omit(yargs.argv, '_');

  if (!positionArgs || !positionArgs.length) {
    throw new Error(`You should specify a command`);
  }

  const command: string = positionArgs[0];
  const positionArgsRest: string[] = positionArgs.slice(1, positionArgs.length);

  if (command === 'start') {
    const commandUpdate: CommandStart = new CommandStart(positionArgsRest, args as any);

    return commandUpdate.start();
  }
  else if (command === 'update') {
    const commandUpdate: CommandUpdate = new CommandUpdate(positionArgsRest, args);

    return commandUpdate.start();
  }
  else if (command === 'log') {
    await backdoorEvent('sub', { ...args, category: 'logger', topic: undefined });
  }
  else if (command === 'pub') {
    await backdoorEvent('pub', args);
  }
  else if (command === 'sub') {
    await backdoorEvent('pub', args);
  }
  else if (command === 'block-io') {
    await backdoorEvent('pub', { ...args, category: 'system', topic: 'block-io' });
  }
  // else if (command === 'io-server') {
  //   const commandUpdate: CommandIoServer = new CommandIoServer(positionArgsRest, args);
  //
  //   return commandUpdate.start();
  // }

  console.error(`Unknown command "${command}"`);
  process.exit(2);
}
