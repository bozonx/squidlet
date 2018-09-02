import * as path from 'path';
const _omit = require('lodash/omit');

import MasterConfig from './interfaces/MasterConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import systemConfig from './configs/systemConfig';


export function prepareMasterConfig(preMasterConfig: {[index: string]: any}): MasterConfig {
  let hosts: {[index: string]: PreHostConfig} = {};

  if (preMasterConfig.hosts) {
    hosts = preMasterConfig.hosts;
  }
  else if (preMasterConfig.host) {
    hosts = {
      master: preMasterConfig.host,
    };
  }

  return {
    ..._omit(preMasterConfig, 'host', 'hosts'),
    hosts
  };
}

export function generateBuildDir(masterConfig: MasterConfig, masterConfigPath: string): string {
  if (masterConfig.hosts && masterConfig.hosts.master.host.storageDir) {
    // use master's storage dir
    const storageDir = masterConfig.hosts.master.host.storageDir;

    if (path.isAbsolute(masterConfigPath)) {
      // it's an absolute path
      return storageDir;
    }
    else {
      // relative path - make it relative to config file
      return path.join(path.dirname(masterConfigPath), storageDir);
    }
  }

  // use default build dir
  return systemConfig.defaultDuildDir;
}
