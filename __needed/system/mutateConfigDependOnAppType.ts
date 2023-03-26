import {AppType} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/AppType.js';
import systemConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';


const allowedConfigs: {[index: string]: {[index: string]: string[]}} = {
  updater: {
    // TODO: add channel drivers
    [systemConfig.fileNames.driversList]: ['WsServer', 'HttpServer', 'WsServerSessions', 'HttpServerRouter'],
    // TODO: add network service
    [systemConfig.fileNames.servicesList]: ['Updater', 'HttpApi', 'WsApi', 'SharedStorage'],
    [systemConfig.fileNames.devicesDefinitions]: [],
  },
  ioServer: {
    // TODO: use channel driver instead of it
    [systemConfig.fileNames.driversList]: ['WsServer', 'HttpServer', 'WsServerSessions', 'HttpServerRouter'],
    // TODO: add network service
    [systemConfig.fileNames.servicesList]: ['IoServer', 'Updater', 'HttpApi', 'WsApi', 'SharedStorage'],
    [systemConfig.fileNames.devicesDefinitions]: [],
  },
};


/**
 * Ignore useless entities in io server and updater mode
 */
export default function mutateConfigDependOnAppType<T>(
  appType: AppType,
  configFileName: string,
  configData: any
): T {
  if (
    ['updater', 'ioServer'].includes(appType)
    && [
      systemConfig.fileNames.driversList,
      systemConfig.fileNames.servicesList,
      systemConfig.fileNames.devicesDefinitions
    ].includes(configFileName)
  ) {
    return allowedConfigs[appType][configFileName] as any;
  }

  return configData;
}
