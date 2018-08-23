import PreHostConfig from './PreHostConfig';


export default interface MasterConfig {
  plugins?: string[];
  // it is short record of hosts: { master: {...PreHostConfig} }
  host?: PreHostConfig;
  hosts?: PreHostConfig[];
  // default params of hosts. It merges with "host" param of host config
  hostDefaults: {[index: string]: any};
}
