import PreHostConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreHostConfig.js';


export default interface MachineConfig {
  ios: {[index: string]: string};
  hostConfig: PreHostConfig;
}
