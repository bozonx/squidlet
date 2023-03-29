
export default interface SysHaltIoType {
  /**
   * It exists script
   */
  exit(code?: number): Promise<void>

  /**
   * It is full reboot of system.
   */
  reboot(): Promise<void>

  /**
   * It turns off the system.
   */
  shutdown(): Promise<void>
}
