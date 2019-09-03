import Platforms from './Platforms';


export default interface HostInfo {
  platform: Platforms;
  machine: string;
  usedIo: string[];
}
