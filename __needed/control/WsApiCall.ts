import WsApiClient from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/bridges/__old/WsApiClient.js';
import hostDefaultConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/configs/hostDefaultConfig.js';
import {Dictionary} from '../../../squidlet-lib/src/interfaces/Types';
import {listenScriptEnd} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/helpers.js';
import {consoleError} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';


export default class WsApiCall {
  /**
   * listen to device's status changes.
   */
  async watchStatus(deviceId: string, host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    const handlerIndex = await apiClient.callMethod(
      'listenDeviceStatus',
      deviceId,
      (changedValues: Dictionary) => {
        console.info(JSON.stringify(changedValues));
      }
    );

    listenScriptEnd(() => apiClient.callMethod('removeStateListener', handlerIndex));
  }

  /**
   * listen to device's config changes.
   */
  async watchConfig(deviceId: string, host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    const handlerIndex = await apiClient.callMethod(
      'listenDeviceConfig',
      deviceId,
      (changedValues: Dictionary) => {
        console.info(JSON.stringify(changedValues));
      }
    );

    listenScriptEnd(() => apiClient.callMethod('removeStateListener', handlerIndex));
  }

  /**
   * listen to state changes.
   */
  async watchState(category: string, stateName: string, host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

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

  /**
   * Listen logs and print them to console
   */
  async log(level: string, host?: string, port?: string) {
    const apiClient = await this.makeClient(host, port);

    const handlerIndex = await apiClient.callMethod('listenLog', level, (message: string) => {
      console.log(message);
    });

    listenScriptEnd(() => apiClient.callMethod('removeLogListener', handlerIndex));
  }


  private async makeClient(host?: string, port?: string): Promise<WsApiClient> {
    const client: WsApiClient = new WsApiClient(
      hostDefaultConfig.config.rcResponseTimoutSec,
      console.log,
      console.info,
      consoleError,
      host,
      (port) ? parseInt(port) : undefined
    );

    await client.init();

    return client;
  }
}



// /**
//  * Print device's status to console.
//  * If watch param is set then it will listen to changes.
//  */
// async status(deviceId: string, host?: string, port?: string, watch?: boolean) {
//   const apiClient = await this.makeClient(host, port);
//
//   if (watch) {
//     const handlerIndex = await apiClient.callMethod(
//       'listenDeviceStatus',
//       deviceId,
//       (changedValues: Dictionary) => {
//         console.info(JSON.stringify(changedValues));
//       }
//     );
//
//     listenScriptEnd(() => apiClient.callMethod('removeStateListener', handlerIndex));
//   }
//   else {
//     const result = await apiClient.callMethod('getDeviceStatus', deviceId);
//     const resultKeys = Object.keys(result);
//
//     if (resultKeys.length === 1 && resultKeys[0] === 'default') {
//       console.info(JSON.stringify(resultKeys[0]));
//     }
//     else {
//       console.info(JSON.stringify(result));
//     }
//
//     await apiClient.close();
//   }
// }
//
// /**
//  * Print device's config to console.
//  * If watch param is set then it will listen to changes.
//  */
// async config(deviceId: string, host?: string, port?: string, watch?: boolean) {
//   const apiClient = await this.makeClient(host, port);
//
//   if (watch) {
//     const handlerIndex = await apiClient.callMethod(
//       'listenDeviceConfig',
//       deviceId,
//       (changedValues: Dictionary) => {
//         console.info(JSON.stringify(changedValues));
//       }
//     );
//
//     listenScriptEnd(() => apiClient.callMethod('removeStateListener', handlerIndex));
//   }
//   else {
//     const result = await apiClient.callMethod('getDeviceConfig', deviceId);
//
//     console.info(JSON.stringify(result));
//     await apiClient.close();
//   }
// }
//
// /**
//  * Print state to console.
//  * If watch param is set then it will listen to changes.
//  */
// async state(category: string, stateName: string, host?: string, port?: string, watch?: boolean) {
//   const apiClient = await this.makeClient(host, port);
//
//   if (watch) {
//     const handlerIndex = await apiClient.callMethod(
//       'listenState',
//       parseInt(category),
//       stateName,
//       (changedValues: Dictionary) => {
//         console.info(JSON.stringify(changedValues));
//       }
//     );
//
//     listenScriptEnd(() => apiClient.callMethod('removeStateListener', handlerIndex));
//   }
//   else {
//     const result = await apiClient.callMethod('getState', parseInt(category), stateName);
//
//     console.info(JSON.stringify(result));
//     await apiClient.close();
//   }
// }

// /**
//  * Print host's info to console
//  */
// async info(host?: string, port?: string) {
//   const apiClient = await this.connect(host, port);
//
//   const result =  await apiClient.callMethod('info');
//
//   console.info(JSON.stringify(result, null, 2));
//   await apiClient.close();
// }

// /**
//  * Call device's action
//  */
// async action(deviceId: string, actionName: string, args: string[], host?: string, port?: string) {
//   const apiClient = await this.makeClient(host, port);
//
//   const result = await apiClient.callMethod('action', deviceId, actionName, ...args);
//
//   console.info(JSON.stringify(result));
//   await apiClient.close();
// }
//
// /**
//  * Print host's info to console
//  */
// async reboot(host?: string, port?: string) {
//   const apiClient = await this.makeClient(host, port);
//
//   const result = await apiClient.callMethod('reboot');
//
//   console.info(result);
//   await apiClient.close();
// }
//
// async switchToIoServer(host?: string, port?: string) {
//   const apiClient = await this.makeClient(host, port);
//
//   await apiClient.callMethod('switchToIoServer');
//
//   console.info(`Switched to platforms server successfully`);
//   await apiClient.close();
// }
