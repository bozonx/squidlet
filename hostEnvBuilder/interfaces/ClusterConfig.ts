import PreHostConfig from './PreHostConfig';


export default interface ClusterConfig {
  plugins?: string[];
  hosts: {[index: string]: PreHostConfig};
  // default params for each host
  hostDefaults?: PreHostConfig;
}
