import {ManifestsTypeName} from '../../host/interfaces/ManifestTypes';
import {isBoolean, isObject, isString, isStringArray, required, sequence} from './validationHelpers';


function validateDeviceManifest(rawManifest: {[index: string]: any}): string | undefined {
  return sequence([
    () => required(rawManifest.type, 'type'),
    () => isString(rawManifest.type, 'type'),

    () => isObject(rawManifest.status, 'status'),

    () => isObject(rawManifest.config, 'config'),
  ]);
}

function validateDriverManifest(rawManifest: {[index: string]: any}): string | undefined {
  return sequence([
    () => required(rawManifest.type, 'type'),
    () => isString(rawManifest.type, 'type'),
  ]);
}


// private checkFiles(baseDir: string, paths: string[]): string[] {
//   return paths.map((item) => {
//     if (path.isAbsolute(item)) {
//       throw new Error(`You must not specify an absolute path of "${item}". Only relative is allowed.`);
//     }
//     else if (item.match(/\.\./)) {
//       throw new Error(`Path "${item}" has to relative to its manifest base dir`);
//     }
//
//     return path.resolve(baseDir, item);
//   });
// }

function validateManifestBase(rawManifest: {[index: string]: any}): string | undefined {
  return sequence([
    () => required(rawManifest.baseDir, 'baseDir'),
    () => isString(rawManifest.baseDir, 'baseDir'),

    () => required(rawManifest.name, 'name'),
    () => isString(rawManifest.name, 'name'),

    () => required(rawManifest.name, 'name'),
    () => isString(rawManifest.main, 'main'),
    // TODO: проверить чтобы не было выхода наверх

    () => isBoolean(rawManifest.system, 'system'),

    () => isStringArray(rawManifest.devices, 'devices'),
    () => isStringArray(rawManifest.drivers, 'drivers'),
    () => isStringArray(rawManifest.services, 'services'),
    () => isStringArray(rawManifest.devs, 'devs'),

    // TODO: проверить чтобы не было выхода наверх
    () => isStringArray(rawManifest.files, 'files'),

    () => isObject(rawManifest.props, 'props'),
  ]);
}


export default function validateManifest (
  manifestType: ManifestsTypeName,
  manifest: {[index: string]: any}
): string | undefined {
  return sequence([
    () => validateManifestBase(manifest),
    () => {
      switch (manifestType) {
        case 'device':
          return validateDeviceManifest(manifest);
        case 'driver':
          return validateDriverManifest(manifest);
        case 'service':
          return;
          //return validateServiceManifest(manifest);
      }
    }
  ]);
}
