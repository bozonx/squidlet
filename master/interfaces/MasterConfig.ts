import PreHostConfig from './PreHostConfig';


export default interface MasterConfig {
  // path to dir where will be placed all the files prepared for hosts
  buildDir?: string;
  plugins?: string[];
  // it is short record of hosts: { master: {...PreHostConfig} }
  host?: PreHostConfig;
  hosts?: PreHostConfig[];
  // default params of hosts. It merges with "host" param of each host config
  hostDefaults: {[index: string]: any};
}
