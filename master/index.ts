import MasterConfig from '../MasterConfig';
import generateMasterSet from './generateMasterSet';
import {PlatformIndex} from './_helper';
import buildHostsConfigs from './buildHostsConfigs';
import * as yargs from 'yargs';


// master:
// * receives master config
// * generate all the host files
// * generate master config set include parsed config, paths to entities and configs and platform config
// * passes it to platform index file and runs host system as is, without building
export default async function () {

  // TODO: сбилдить систему чтобы рассылать ее потом слейвам

  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const config: MasterConfig = await readConfig<MasterConfig>(resolvedPath);

  //await masterIndex(config);

  // make config and entity files of hosts
  await buildHostsConfigs(config);
  // generate master config js object with paths of master host configs and entities files
  const masterSet = await generateMasterSet(config);
  const platformName: string = masterSet.platform;
  const platformIndex: PlatformIndex = platforms[platformName];

  // TODO: добавить config set manager

  platformIndex(masterSet);
}


//////////////////



// TODO: doesn't need

/**
 * run `ts-node ./index.ts --config ./myConfigFile.yaml`
 */
import * as path from 'path';
import * as yargs from 'yargs';

import Main from './Main';
import { loadYamlFile } from './IO';


yargs.help(`
suqidlet-build --config ./path-to-my-config
`);


async function init() {
  if (!yargs.argv.config) {
    console.error(`You have to specify a "--config" param`);

    process.exit(3);
  }

  const resolvedPath = path.resolve(yargs.argv.config);
  const configJs = await loadYamlFile(resolvedPath);
  const configurator = new Main(configJs, resolvedPath);

  await configurator.start();
}

init()
  .catch((err) => {
    // TODO: наверное лучше просто console.error
    //throw new Error(err);

    console.error(err.toString())

    process.exit(2);
  });
