import {SysPermanentInfo} from '../SysInfo.js'


export default interface SysInfoIo {
  getInfo(): Promise<SysPermanentInfo>
  // get amount of used memory in megabytes
  getUsedMem(): Promise<number>
  // get number of percent of each CPU load
  getCpuLoad(): Promise<number[]>
}
