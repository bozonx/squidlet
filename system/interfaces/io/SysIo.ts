import IoItem from '../IoItem';
import SysInfo from '../SysInfo';
import IoManager from '../../managers/IoManager';


export const Methods = [
  'restart',
  'reboot',
  'shutdown',
  'info',
];

export interface SysConfig {
  exit?: (code: number) => void;
}


export default interface SysIo extends IoItem {
  init(ioManager: IoManager, props: SysConfig): Promise<void>;
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
   * It turn off the system.
   */
  shutdown(): Promise<void>;

  info(): Promise<SysInfo>;
}
