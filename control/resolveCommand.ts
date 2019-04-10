import * as yargs from 'yargs';

import commandUpdate from './commandUpdate';


export default async function resolveCommand() {
  if (!yargs.argv._.length) {
    throw new Error(`You should specify a command`);
  }

  const COMMAND: string = yargs.argv._[0];

  if (COMMAND === 'update') {
    return commandUpdate();
  }

}
