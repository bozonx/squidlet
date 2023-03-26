import HttpApiClient from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/bridges/__old/HttpApiClient.js';
import {AppType} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/AppType.js';


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

  async switchApp(appType: AppType, host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    await apiClient.callMethod('switchApp', appType);

    console.info(`Switched to app "${appType}" successfully`);
  }


  private async makeClient(host?: string, port?: string): Promise<HttpApiClient> {
    return  new HttpApiClient(
      console.log,
      host,
      (port) ? parseInt(port) : undefined
    );
  }
}
