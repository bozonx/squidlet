import Platforms from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/Platforms.js';
import {AppType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/AppType.js';


export default interface HostInfo {
  appType: AppType;
  platform: Platforms;
  machine: string;
  usedIo: string[];
}
