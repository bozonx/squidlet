import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';


export default interface GroupConfig {
  plugins?: string[];
  hosts: (PreHostConfig | string)[];
  // default params for each host
  hostDefaults?: PreHostConfig;
}
