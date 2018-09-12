export default function validateMasterConfig(rawConfig: {[index: string]: any}): string | undefined {
  // TODO: add
  // TODO: validate definitions

  // if (!this.masterConfig.host || this.masterConfig.hosts) {
  //   throw new Error(`Master config doesn't have "host" or "hosts" params`);
  // }


  return undefined;
}

// TODO: main files and files of entities должны быть относительные пути

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
