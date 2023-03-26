import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';


export default interface GroupConfig {
  // // dir relative group config yaml file where will be placed files of hosts
  // buildDir?: string;
  // // dir for temporary files. By default it is "__tmp" dir placed in buildDir
  // tmpDir?: string;
  plugins?: string[];
  // default params for each host
  hostDefaults?: PreHostConfig;
  hosts: (PreHostConfig | string)[];
}
