import {isString, isNumber, isStringArray, isObject, oneOf, required, sequence} from './validationHelpers';


function checkBuildConfig(rawConfig: {[index: string]: any}): string | undefined {
  if (typeof rawConfig.buildConfig === 'undefined') return;

  return sequence([
    () => isObject(rawConfig.buildConfig, 'buildConfig'),
    () => isString(rawConfig.buildConfig.devsModernDst, 'buildConfig.devsModernDst'),
    () => isString(rawConfig.buildConfig.devsLegacyDst, 'buildConfig.devsLegacyDst'),
    () => isString(rawConfig.buildConfig.devsMinDst, 'buildConfig.devsMinDst'),
    () => isString(rawConfig.buildConfig.devsSrc, 'buildConfig.devsSrc'),
  ]);
}

function checkConfig(rawConfig: {[index: string]: any}): string | undefined {
  if (typeof rawConfig.config === 'undefined') return;

  return sequence([
    () => isObject(rawConfig.config, 'config'),
    () => isString(rawConfig.config.varDataDir, 'config.varDataDir'),
    () => isString(rawConfig.config.envSetDir, 'config.envSetDir'),
    () => oneOf(rawConfig.config.logLevel, ['debug', 'verbose', 'info', 'warn', 'error', 'fatal'], 'config.logLevel'),
    () => isNumber(rawConfig.config.defaultStatusRepublishIntervalMs, 'config.defaultStatusRepublishIntervalMs'),
    () => isNumber(rawConfig.config.defaultConfigRepublishIntervalMs, 'config.defaultConfigRepublishIntervalMs'),
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

    () => checkBuildConfig(rawConfig),
    () => checkConfig(rawConfig),

  ]);
}



// TODO: validate definitions

// TODO: main files and files of entities должны быть относительные пути
// TODO: id драйвера должно совпадать с полем driver у definition

// const recursive = (container, curPath) => {
//   _.each(container, (item, name) => {
//     const itemPath = _.trimStart(`${curPath}.${name}`, '.');
//
//     if (_.isString(item)) {
//       // TODO: validate type
//     }
//     else if (_.isPlainObject(item) && item.type) {
//       // TODO: validate type
//     }
//     else if (_.isPlainObject(item)) {
//       recursive(item, itemPath);
//     }
//     else {
//       throw new Error(`Can't parse schema of device ${deviceName}`);
//     }
//   });
//
// };
//
// recursive(schema.params, '');

// TODO: проверить существование файлов из манифеста

// if (!await this.fs.exists(entitySet.main)) {
//   throw new Error(`Can't find main file "${entitySet.main}"`);
// }
