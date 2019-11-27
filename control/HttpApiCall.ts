import HttpApiClient from '../shared/HttpApiClient';


export default class HttpApiCall {
  /**
   * Print host's info to console
   */
  async info(host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);
    const result =  await apiClient.callMethod('info');

    console.info(JSON.stringify(result, null, 2));
  }

  /**
   * Call device's action
   */
  async action(deviceId: string, actionName: string, args: string[], host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    const result = await apiClient.callMethod('action', deviceId, actionName, ...args);

    console.info(JSON.stringify(result));
  }

  /**
   * Print device's status to console.
   */
  async getStatus(deviceId: string, host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    const result = await apiClient.callMethod('getDeviceStatus', deviceId);

    console.info(JSON.stringify(result));
  }

  /**
   * Print device's config to console.
   */
  async getConfig(deviceId: string, host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    const result = await apiClient.callMethod('getDeviceConfig', deviceId);

    console.info(JSON.stringify(result));
  }

  /**
   * Print state to console.
   */
  async getState(category: number, stateName: string, host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    const result = await apiClient.callMethod('getState', category, stateName);

    console.info(JSON.stringify(result));
  }

  /**
   * Print host's info to console
   */
  async reboot(host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    const result = await apiClient.callMethod('reboot');

    console.info(result);
  }

  async switchToIoServer(host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    await apiClient.callMethod('switchToIoServer');

    console.info(`Switched to io server successfully`);
  }

  async switchToApp(host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    await apiClient.callMethod('switchToApp');

    console.info(`Switched to io app successfully`);
  }


  private async makeClient(host?: string, port?: string): Promise<HttpApiClient> {
    return  new HttpApiClient(
      console.log,
      host,
      (port) ? parseInt(port) : undefined
    );
  }
}
