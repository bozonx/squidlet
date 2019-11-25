import IoItem from '../IoItem';
import SysInfo from '../SysInfo';


export const Methods = [
  'restart',
  'reboot',
  'shutdown',
  'info',
];


export default interface SysIo extends IoItem {
  /**
   * It exists script
   */
  exit(): Promise<void>;

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
