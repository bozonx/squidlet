import * as yargs from 'yargs';

console.log(1111111111, yargs.argv)


export default async function start() {
  if (!yargs.argv._.length) {
    throw new Error(`You should specify a command`);
  }

  const COMMAND: string = yargs.argv._[0];

  if (COMMAND === 'update') {
    let hostName: string | undefined;
    let groupConfigPath: string;

    // specified only group config
    if (yargs.argv._[1] && !yargs.argv._[2]) {
      groupConfigPath = yargs.argv._[1];
    }
    // specified host name and group config
    else if (!yargs.argv._[1] && !yargs.argv._[2]) {
      hostName = yargs.argv._[1];
      groupConfigPath = yargs.argv._[2];
    }
    else {
      throw new Error(`You should specify a group config path`);
    }


  }

}
