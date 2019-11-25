import IoItem from '../IoItem';
import SysInfo from '../SysInfo';


export const Methods = [
  'reboot',
  'shutdown',
  'info',
];


export default interface SysIo extends IoItem {
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
