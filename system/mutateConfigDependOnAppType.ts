import {AppType} from './interfaces/AppType';
import systemConfig from './systemConfig';


const allowedConfigs: {[index: string]: {[index: string]: string[]}} = {
  updater: {
    [systemConfig.fileNames.driversList]: [],
    [systemConfig.fileNames.servicesList]: [],
  },
  ioServer: {
    [systemConfig.fileNames.driversList]: [],
    [systemConfig.fileNames.servicesList]: ['IoServer'],
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
      systemConfig.fileNames.servicesList
    ].includes(configFileName)
  ) {
    return allowedConfigs[appType][configFileName] as any;
  }

  return configData;
}
