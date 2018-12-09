import * as path from 'path';
import * as yargs from 'yargs';
import * as shelljs from 'shelljs';

import {readConfig, resolveConfigPath} from './helpers';
import PreMasterConfig from '../configWorks/interfaces/PreMasterConfig';
import Main from '../configWorks/Main';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';


const tmpDir = path.resolve(__dirname, './build/solid/tmp');


export default async function () {
  if (!yargs.argv.name) {
    throw new Error(`You have to specify a host's "--name" param`);
  }
  else if (!yargs.argv.config) {
    throw new Error(`You have to specify a master "--config" param`);
  }

  const hostId: string = yargs.argv.name;
  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const masterConfig: PreMasterConfig = await readConfig<PreMasterConfig>(resolvedPath);
  const main: Main = new Main(masterConfig, resolvedPath);

  console.info(`===> Collecting configs and entities files of host`);
  await main.collect();

  console.info(`===> generate master config object`);

  const hostConfigSet: HostFilesSet = {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    config: main.masterConfig.getFinalHostConfig(hostId),
    entitiesSet: main.hostsFilesSet.generateDstEntitiesSet(main, hostId),
  };

  shelljs.mkdir('-p', tmpDir);

  console.log(111111111, hostConfigSet);

  // TODO: write tmp file with hostConfigSet as global to build/solid
  // TODO: write tmp file with entities as global
  // TODO: write tmp file with devs as global
}
