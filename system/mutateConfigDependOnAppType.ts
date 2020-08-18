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


export default function mutateConfigDependOnAppType(
  appType: AppType,
  configFileName: string,
  configData: string[]
): string[] {
  if (
    ['updater', 'ioServer'].includes(appType)
    && [
      systemConfig.fileNames.driversList,
      systemConfig.fileNames.servicesList
    ].includes(configFileName)
  ) {
    return allowedConfigs[appType][configFileName];
  }

  return configData;
}
