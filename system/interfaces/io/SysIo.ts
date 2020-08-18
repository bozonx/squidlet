import IoItem from '../IoItem';
import SysInfo from '../SysInfo';
import {AppType} from '../AppType';


export const Methods = [
  'configure',
  'exit',
  'reboot',
  'shutdown',
  'info',
];

export interface SysConfig {
  exit?: (code: number, switchToApp?: AppType) => void;
}


export default interface SysIo extends IoItem {
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
