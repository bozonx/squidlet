import {isString, isStringArray, oneOf, required, sequence} from './validationHelpers';


export default function validateHostConfig(rawConfig: {[index: string]: any}): string | undefined {
  if (typeof rawConfig !== 'object') return 'Host config has to be an object';

  return sequence([
    () => isString(rawConfig.id, 'id'),
    () => required(rawConfig.platform, 'platform'),
    () => oneOf(rawConfig.platform, ['nodejs', 'lowjs', 'espruino'], 'platform'),
    () => required(rawConfig.machine, 'machine'),
    () => isString(rawConfig.machine, 'machine'),
    () => isStringArray(rawConfig.plugins, 'plugins'),
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
