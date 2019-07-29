import {isString, isNumber, isStringArray, isObject, oneOf, required, sequence} from './validationHelpers';
import {whiteList} from '../../system/lib/validate';


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
    // 'verbose',
    //() => oneOf(rawConfig.config.logLevel, ['debug', 'info', 'warn', 'error'], 'config.logLevel'),
    //() => isNumber(rawConfig.config.defaultStatusRepublishIntervalMs, 'config.defaultStatusRepublishIntervalMs'),
    //() => isNumber(rawConfig.config.defaultConfigRepublishIntervalMs, 'config.defaultConfigRepublishIntervalMs'),
    () => isNumber(rawConfig.config.senderTimeout, 'config.senderTimeout'),
    () => isNumber(rawConfig.config.senderResendTimeout, 'config.senderResendTimeout'),
  ]);
}

export default function validateHostConfig(rawConfig: {[index: string]: any}): string | undefined {
  if (typeof rawConfig !== 'object') return 'Host config has to be an object';

  return sequence([
    () => isString(rawConfig.id, 'id'),

    () => required(rawConfig.platform, 'platform'),
    () => oneOf(rawConfig.platform, ['nodejs', 'lowjs', 'espruino'], 'platform'),

    () => required(rawConfig.machine, 'machine'),
    () => isString(rawConfig.machine, 'machine'),

    () => isStringArray(rawConfig.plugins, 'plugins'),

    () => isObject(rawConfig.devices, 'devices'),
    () => isObject(rawConfig.drivers, 'drivers'),
    () => isObject(rawConfig.services, 'services'),
    () => isObject(rawConfig.ios, 'ios'),
    () => isObject(rawConfig.automation, 'automation'),
    () => isObject(rawConfig.consoleLogger, 'consoleLogger'),
    () => isObject(rawConfig.mqtt, 'mqtt'),
    () => isObject(rawConfig.backdoor, 'backdoor'),

    () => isObject(rawConfig.devicesDefaults, 'devicesDefaults'),

    //() => checkBuildConfig(rawConfig),

    () => checkConfig(rawConfig),

    () => whiteList(rawConfig, [
      'id',
      'platform',
      'machine',
      'plugins',
      //'buildConfig',
      'config',
      'devices',
      'drivers',
      'services',
      'ios',
      'devicesDefaults',
      'automation',
      'consoleLogger',
      'mqtt',
      'backdoor',
    ], 'host config'),
  ]);
}
