import * as yargs from 'yargs';

import MasterConfig from '../MasterConfig';
import generateMasterSet from './generateMasterSet';
import {getPlatformIndex, PlatformIndex, readConfig, resolveConfigPath} from './helpers';
import buildHostsConfigs from './buildHostsConfigs';


// master:
// * receives master config
// * generate all the host files
// * generate master config set include parsed config, paths to entities and configs and platform config
// * passes it to platform index file and runs host system as is, without building
export default async function () {
  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const config: MasterConfig = await readConfig<MasterConfig>(resolvedPath);

  // make config and entity files of hosts
  await buildHostsConfigs(config);
  // generate master config js object with paths of master host configs and entities files
  const masterSet = await generateMasterSet(config);
  const platformName: string = masterSet.platform;
  const platformIndex: PlatformIndex = getPlatformIndex(platformName);

  // TODO: добавить config set manager

  platformIndex(masterSet);
}
