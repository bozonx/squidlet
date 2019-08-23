import IoItem from '../IoItem';


export const Methods = [
  'restart',
  'reboot',
];


export default interface SysIo extends IoItem {
  /**
   * It restarts whole nodejs instance.
   * On micro-controllers it make reboot.
   * It uses for updates and switch to io-server
   */
  restart(): Promise<void>;

  /**
   * It is full reboot of system.
   * It doesn't use in any scenarios, use it by your self.
   */
  reboot(): Promise<void>;
}
