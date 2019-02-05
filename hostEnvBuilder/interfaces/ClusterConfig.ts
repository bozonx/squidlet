import PreHostConfig from './PreHostConfig';


export default interface ClusterConfig {
  plugins?: string[];
  hosts: {[index: string]: PreHostConfig};
  // default params of hosts
  hostDefaults?: {[index: string]: any};
}
