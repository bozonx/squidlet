import Platforms from './Platforms';
import {AppType} from './AppType';


export default interface HostInfo {
  appType: AppType;
  platform: Platforms;
  machine: string;
  usedIo: string[];
}
