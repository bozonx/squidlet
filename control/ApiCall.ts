import WsApiClient from '../shared/WsApiClient';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';
import {Dictionary} from '../system/interfaces/Types';
import {listenScriptEnd} from '../shared/helpers';


export default class ApiCall {
  /**
   * Call device's action
   */
  async action(deviceId: string, actionName: string, args: string[], host?: string, port?: string) {
    const apiClient = await this.connect(host, port);

    const result = await apiClient.callMethod('callDeviceAction', deviceId, actionName, ...args);

    console.info(JSON.stringify(result));

    await apiClient.close();
  }

  /**
   * Print device's status to console.
   * If watch param is set then it will listen to changes.
   */
  async status(deviceId: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = await this.connect(host, port);

    if (watch) {
      const handlerIndex = await apiClient.callMethod(
        'listenDeviceStatus',
        deviceId,
        undefined,
        (changedValues: Dictionary) => {
          console.info(JSON.stringify(changedValues));
        }
      );

      listenScriptEnd(() => apiClient.callMethod('removeStateListener', handlerIndex));
    }
    else {
      const result = await apiClient.callMethod('getDeviceStatus', deviceId);

      console.info(JSON.stringify(result));
      await apiClient.close();
    }
  }

  /**
   * Print device's config to console.
   * If watch param is set then it will listen to changes.
   */
  async config(deviceId: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = await this.connect(host, port);

    if (watch) {
      const handlerIndex = await apiClient.callMethod(
        'listenDeviceConfig',
        deviceId,
        (changedValues: Dictionary) => {
          console.info(JSON.stringify(changedValues));
        }
      );

      listenScriptEnd(() => apiClient.callMethod('removeStateListener', handlerIndex));
    }
    else {
      const result = await apiClient.callMethod('getDeviceConfig', deviceId);

      console.info(JSON.stringify(result));
      await apiClient.close();
    }
  }

  /**
   * Print state to console.
   * If watch param is set then it will listen to changes.
   */
  async state(category: string, stateName: string, host?: string, port?: string, watch?: boolean) {
    const apiClient = await this.connect(host, port);

    if (watch) {
      const handlerIndex = await apiClient.callMethod(
        'listenState',
        parseInt(category),
        stateName,
        (changedValues: Dictionary) => {
          console.info(JSON.stringify(changedValues));
        }
      );

      listenScriptEnd(() => apiClient.callMethod('removeStateListener', handlerIndex));
    }
    else {
      const result = await apiClient.callMethod('getState', parseInt(category), stateName);

      console.info(JSON.stringify(result));
      await apiClient.close();
    }
  }

  /**
   * Print host's config to console
   */
  async hostConfig(host?: string, port?: string) {
    const apiClient = await this.connect(host, port);

    const result = await apiClient.callMethod('getHostConfig');

    console.info(JSON.stringify(result));
    await apiClient.close();
  }

  /**
   * Print host's info to console
   */
  async hostInfo(host?: string, port?: string) {
    const apiClient = await this.connect(host, port);

    const result =  await apiClient.callMethod('getHostInfo');

    console.info(JSON.stringify(result));
    await apiClient.close();
  }

  /**
   * Listen logs and print them to console
   */
  async log(level?: string, host?: string, port?: string) {
    const apiClient = await this.connect(host, port);

    const handlerIndex = await apiClient.callMethod('listenLog', level, (message: string) => {
      console.log(message);
    });

    listenScriptEnd(() => apiClient.callMethod('removeLogListener', handlerIndex));
  }

  async switchToIoServer(host?: string, port?: string) {
    const apiClient = await this.connect(host, port);

    await apiClient.callMethod('switchToIoServer');

    console.info(`Switched to io server successfully`);
    await apiClient.close();
  }


  private async connect(host?: string, port?: string): Promise<WsApiClient> {
    const client: WsApiClient = new WsApiClient(
      hostDefaultConfig.config.rcResponseTimoutSec,
      console.info,
      console.error,
      host,
      (port) ? parseInt(port) : undefined
    );

    await client.init();

    return client;
  }
}
