import {isString, isNumber, isStringArray, isObject, oneOf, required, sequence} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/validationHelpers.js';
import {whiteList} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/validate.js';


// function checkBuildConfig(rawConfig: {[index: string]: any}): string | undefined {
//   if (typeof rawConfig.buildConfig === 'undefined') return;
//
//   return sequence([
//     () => isObject(rawConfig.buildConfig, 'buildConfig'),
//     () => isString(rawConfig.buildConfig.iosModernDst, 'buildConfig.iosModernDst'),
//     () => isString(rawConfig.buildConfig.iosLegacyDst, 'buildConfig.iosLegacyDst'),
//     () => isString(rawConfig.buildConfig.iosMinDst, 'buildConfig.devsMinDst'),
//     () => isString(rawConfig.buildConfig.devsSrc, 'buildConfig.devsSrc'),
//   ]);
// }

function checkConfig(rawConfig: {[index: string]: any}): string | undefined {
  if (typeof rawConfig.config === 'undefined') return;

  return sequence([
    () => isObject(rawConfig.config, 'config'),
    // () => isString(rawConfig.config.varDataDir, 'config.varDataDir'),
    // () => isString(rawConfig.config.envSetDir, 'config.envSetDir'),
    //() => isNumber(rawConfig.config.defaultStatusRepublishIntervalMs, 'config.defaultStatusRepublishIntervalMs'),
    //() => isNumber(rawConfig.config.defaultConfigRepublishIntervalMs, 'config.defaultConfigRepublishIntervalMs'),
    () => isNumber(rawConfig.config.requestTimeoutSec, 'config.requestTimeoutSec'),
    () => isNumber(rawConfig.config.senderResendTimeout, 'config.senderResendTimeout'),
  ]);
}

export default function validateHostConfig(rawConfig: {[index: string]: any}): string | undefined {
  if (typeof rawConfig !== 'object') return 'Host config has to be an object';

  return sequence([
    () => isString(rawConfig.id, 'id'),

    () => isStringArray(rawConfig.plugins, 'plugins'),

    () => isObject(rawConfig.devices, 'devices'),
    () => isObject(rawConfig.drivers, 'drivers'),
    () => isObject(rawConfig.services, 'services'),
    () => isObject(rawConfig.ios, 'ios'),
    () => isObject(rawConfig.automation, 'automation'),
    //() => isObject(rawConfig.consoleLogger, 'consoleLogger'),
    () => isObject(rawConfig.network, 'network'),
    () => isObject(rawConfig.wsApi, 'wsApi'),
    () => isObject(rawConfig.httpApi, 'httpApi'),
    () => isObject(rawConfig.updater, 'updater'),
    () => isObject(rawConfig.ioServer, 'ioServer'),

    () => isObject(rawConfig.devicesDefaults, 'devicesDefaults'),

    //() => checkBuildConfig(rawConfig),

    () => checkConfig(rawConfig),

    () => whiteList(rawConfig, [
      'id',
      'plugins',
      //'buildConfig',
      'config',
      'devices',
      'drivers',
      'services',
      'ios',
      'devicesDefaults',
      'automation',
      //'consoleLogger',
      'network',
      'wsApi',
      'httpApi',
      'ioServer',
      'updater',
    ], 'host config'),
  ]);
}
