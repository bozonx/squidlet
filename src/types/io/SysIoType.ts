import SysInfo from '../../../../../__old/system/interfaces/SysInfoIo';
import {AppType} from '../../../../../__old/system/interfaces/AppType';


export interface SysConfig {
  exit?: (code: number, switchToApp?: AppType) => void;
}


export default interface SysIoType extends IoItem {
  /**
   * Setup props before init
   */
  configure(props: SysConfig): Promise<void>;

  /**
   * It exists script
   */
  exit(code?: number): Promise<void>;

  /**
   * It is full reboot of system.
   */
  reboot(): Promise<void>;

  /**
   * It turns off the system.
   */
  shutdown(): Promise<void>;


  info(): Promise<SysInfo>;
}
