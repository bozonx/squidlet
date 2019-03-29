import SchemaElement from '../../host/interfaces/SchemaElement';


// function checkDevices(rawConfig: {[index: string]: any}): string | undefined {
//   // TODO: add
// }
//
// function checkDrivers(rawConfig: {[index: string]: any}): string | undefined {
//   // TODO: проверить что есть такой драйвер
// }
//
// function checkServices(rawConfig: {[index: string]: any}): string | undefined {
//   // TODO: add
// }
//
// function checkAutomation(rawConfig: {[index: string]: any}): string | undefined {
//   // TODO: add
// }
//
// function checkMqtt(rawConfig: {[index: string]: any}): string | undefined {
//   // TODO: add
// }
//
// function checkLogger(rawConfig: {[index: string]: any}): string | undefined {
//   // TODO: add
// }


export default function validateProps(
  props: {[index: string]: any},
  schema?: {[index: string]: SchemaElement}
): string | undefined {
  if (!schema) return;



  return;
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
