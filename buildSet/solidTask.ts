import * as path from 'path';
import * as fs from 'fs';
import * as yargs from 'yargs';
import * as shelljs from 'shelljs';

import {readConfig, resolveConfigPath} from './helpers';
import PreMasterConfig from '../configWorks/interfaces/PreMasterConfig';
import Main from '../configWorks/Main';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';


const tmpDir = path.resolve(__dirname, './build/solid/tmp');
const hostConfigSetFileName = 'hostConfigSet.js';
const tmpHostConfigSet = path.resolve(tmpDir, hostConfigSetFileName);


function writeConfigSet(hostId: string, main: Main) {
  const hostConfigSet: HostFilesSet = {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    config: main.masterConfig.getFinalHostConfig(hostId),
    entitiesSet: main.hostsFilesSet.generateDstEntitiesSet(main, hostId),
  };

  const configSetContent = `global.__HOST_CONFIG_SET = ${JSON.stringify(hostConfigSet)}`;

  console.info(`---> write host config set`);
  console.info(JSON.stringify(hostConfigSet, null, 2));

  fs.writeFileSync(tmpHostConfigSet, configSetContent);
}


export default async function () {
  if (!yargs.argv.config) {
    throw new Error(`You have to specify a master "--config" param`);
  }

  const hostId: string = yargs.argv.name || 'master';
  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const masterConfig: PreMasterConfig = await readConfig<PreMasterConfig>(resolvedPath);
  const main: Main = new Main(masterConfig, resolvedPath);

  console.info(`===> Collecting configs and entities files of "${hostId}" host`);
  await main.collect();

  shelljs.mkdir('-p', tmpDir);

  console.info(`===> generate master config object`);
  writeConfigSet(hostId, main);

  // TODO: write tmp file with entities as global
  // TODO: write tmp file with devs as global
}
