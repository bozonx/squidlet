import {SysPermanentInfo} from '../SysInfo.js'


export default interface SysInfoIo {
  getInfo(): Promise<SysPermanentInfo>
}
