import Platforms from './Platforms';


export type HostType = 'app' | 'ioServer';


export default interface HostInfo {
  hostType: HostType;
  platform: Platforms;
  machine: string;
  usedIo: string[];
}
