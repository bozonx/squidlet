import * as yargs from 'yargs';
import GroupConfig from './GroupConfig';
import UpdateHost from './UpdateHost';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';


async function updateHost(hostConfig: PreHostConfig) {
  const updateHost: UpdateHost = new UpdateHost(hostConfig);

  console.info(`==> updating host "${hostConfig.id}"`);
  await updateHost.update();
}

async function runUpdate() {
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

  const groupConfig: GroupConfig = new GroupConfig(groupConfigPath);

  await groupConfig.init();

  if (hostName) {
    await updateHost(groupConfig.hosts[hostName]);
  }
  else {
    for (let currentHostName of Object.keys(groupConfig.hosts)) {
      await updateHost(groupConfig.hosts[currentHostName]);
    }
  }
}


export default async function start() {
  if (!yargs.argv._.length) {
    throw new Error(`You should specify a command`);
  }

  const COMMAND: string = yargs.argv._[0];

  if (COMMAND === 'update') {
    return runUpdate();
  }

}
