import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';


export default interface GroupConfig {
  plugins?: string[];
  hosts: {[index: string]: PreHostConfig};
  // default params for each host
  hostDefaults?: PreHostConfig;
}
