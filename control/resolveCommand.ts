import * as yargs from 'yargs';

import CommandUpdate from './CommandUpdate';
import CommandStart from './CommandStart';


export default async function resolveCommand() {
  const positionArgs: string[] = [ ...yargs.argv._ ];

  if (!positionArgs || !positionArgs.length) {
    throw new Error(`You should specify a command`);
  }

  const COMMAND: string = positionArgs[0];
  const positonArgsRest: string[] = positionArgs.slice(1, positionArgs.length);

  if (COMMAND === 'update') {
    const commandUpdate: CommandUpdate = new CommandUpdate(positonArgsRest);

    return commandUpdate.start();
  }

  if (COMMAND === 'start') {
    const commandUpdate: CommandStart = new CommandStart(positonArgsRest);

    return commandUpdate.start();
  }

}
