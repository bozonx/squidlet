import * as yargs from 'yargs';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfig from './GroupConfig';


async function updateHost(hostConfig: PreHostConfig) {
  const updateHost: UpdateHost = new UpdateHost(hostConfig);

  console.info(`==> updating host "${hostConfig.id}"`);
  await updateHost.update();
}


export default async function commandUpdate() {
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

  // update only specified host
  if (hostName) {
    await updateHost(groupConfig.hosts[hostName]);
  }
  // update all the hosts
  else {
    for (let currentHostName of Object.keys(groupConfig.hosts)) {
      await updateHost(groupConfig.hosts[currentHostName]);
    }
  }

}
