import PreHostConfig from './PreHostConfig';


export default interface MasterConfig {
  plugins?: string[];
  // it is short record of hosts: { master: {...PreHostConfig} }
  host: PreHostConfig;
  hosts: Array<PreHostConfig>;
}
