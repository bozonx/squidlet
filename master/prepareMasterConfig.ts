const _omit = require('lodash/omit');

import MasterConfig from './interfaces/MasterConfig';
import PreHostConfig from './interfaces/PreHostConfig';


export default function prepareMasterConfig(preMasterConfig: {[index: string]: any}): MasterConfig {
  let hosts: {[index: string]: PreHostConfig} = {};

  if (this.masterConfig.hosts) {
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
