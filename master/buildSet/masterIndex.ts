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
// * generate all the host files exclude master (these files will be sent to hosts)
// * generate files paths and configs to js object in memory
// * pass it to platform build
// * run host system as is, without building

export default async function (config: MasterConfig) {
  // make config and entity files of hosts
  await buildHostsConfigs(config);
  // generate master config js object with paths of master host configs and entities files
  const masterSet = await generateMasterSet(config);
  const preparedConfig = {};
  const platformName: string = masterSet.platform;
  const platformIndex: PlatformIndex = platforms[platformName];

  // TODO: get platform config

  platformIndex(preparedConfig);

}
