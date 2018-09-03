import PreHostConfig from './PreHostConfig';


export default interface PreMasterConfig {
  plugins?: string[];
  // it is short record of hosts: { master: {...PreHostConfig} }
  host?: PreHostConfig;
  hosts?: {[index: string]: PreHostConfig};
  // default params of hosts. It merges with "host" param of each host config
  hostDefaults: {[index: string]: any};
}
