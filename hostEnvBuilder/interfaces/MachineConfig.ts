import PreHostConfig from './PreHostConfig';


export default interface MachineConfig {
  devs?: string[];
  hostConfig: PreHostConfig;
}
