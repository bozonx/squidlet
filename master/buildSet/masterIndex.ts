import MasterConfig from '../MasterConfig';
import generateMasterSet from './generateMasterSet';
import x86 from '../../platforms/squidlet-x86';
import rpi from '../../platforms/squidlet-rpi';
import {PlatformIndex} from './_helper';
import buildHostsConfigs from './buildHostsConfigs';


const platforms: {[index: string]: PlatformIndex} = {
  x86,
  rpi,
};

// master:
// * receives master config
// * generate all the host files
// * generate master config set include parsed config, paths to entities and configs and platform config
// * passes it to platform index file and runs host system as is, without building
export default async function (config: MasterConfig) {
  // make config and entity files of hosts
  await buildHostsConfigs(config);
  // generate master config js object with paths of master host configs and entities files
  const masterSet = await generateMasterSet(config);
  const platformName: string = masterSet.platform;
  const platformIndex: PlatformIndex = platforms[platformName];

  // TODO: добавить config set manager

  platformIndex(masterSet);
}
