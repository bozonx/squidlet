export default interface SysHaltIoType {
  /**
   * It exists script with code.
   * It will wait 1 second to be able to return an answer
   */
  exit(code?: number): Promise<void>

  /**
   * It is full reboot of system.
   */
  reboot(): Promise<void>

  /**
   * It turns off the system
   */
  shutdown(): Promise<void>
}
