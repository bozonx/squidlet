import _omit = require('lodash/omit');
import * as yargs from 'yargs';

import CommandUpdate from './CommandUpdate';
import CommandStart from './CommandStart';
import CommandIoServer from './CommandIoServer';


export default async function resolveCommand() {
  const positionArgs: string[] = [ ...yargs.argv._ ];
  const args: {[index: string]: any} = _omit(yargs.argv, '_');

  if (!positionArgs || !positionArgs.length) {
    throw new Error(`You should specify a command`);
  }

  const command: string = positionArgs[0];
  const positionArgsRest: string[] = positionArgs.slice(1, positionArgs.length);

  if (command === 'update') {
    const commandUpdate: CommandUpdate = new CommandUpdate(positionArgsRest, args);

    return commandUpdate.start();
  }
  else if (command === 'start') {
    const commandUpdate: CommandStart = new CommandStart(positionArgsRest, args);

    return commandUpdate.start();
  }
  else if (command === 'io-server') {
    const commandUpdate: CommandIoServer = new CommandIoServer(positionArgsRest, args);

    return commandUpdate.start();
  }

  console.error(`Unknown command "${command}"`);
  process.exit(2);
}
