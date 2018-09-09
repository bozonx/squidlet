import MasterConfig from '../MasterConfig';
import generateMasterSet from './generateMasterSet';
import {PlatformIndex} from './_helper';
import buildHostsConfigs from './buildHostsConfigs';


export default async function (config: MasterConfig) {


  // // make config and entity files of hosts
  // await buildHostsConfigs(config);
  // // generate master config js object with paths of master host configs and entities files
  // const masterSet = await generateMasterSet(config);
  // const platformName: string = masterSet.platform;
  // const platformIndex: PlatformIndex = platforms[platformName];
  //
  // // TODO: добавить config set manager
  //
  // platformIndex(masterSet);
}
