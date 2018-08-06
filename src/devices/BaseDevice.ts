export default class BaseDevice {
  constructor() {
    // TODO: init status
    // TODO: init config
  }

  /**
   * Get status from device.
   */
  async getStatus(statusName: string = 'default'): Promise<void> {

  }

  /**
   * Get whole config from device.
   */
  async getConfig(): Promise<void> {

  }

  /**
   * Set status of device.
   */
  async setStatus(newValue: any, statusName: string = 'default'): Promise<void> {

  }

  /**
   * Set config to device
   */
  async setConfig(partialConfig: {[index: string]: any}): Promise<void> {

  }

  async publishAction(actionName: string, result: any): Promise<void> {
    // TODO: может делаться на удаленное устройство
  }

}
