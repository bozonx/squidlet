import {ManifestsTypeName} from '../../system/interfaces/ManifestTypes';
import {
  isBoolean,
  isLocalPath,
  isObject,
  isString,
  isStringArray,
  required,
  sequence
} from './validationHelpers';
import validateRules from './validateRules';


function validateDeviceManifest(rawManifest: {[index: string]: any}): string | undefined {
  return sequence([
    () => required(rawManifest.type, 'type'),
    () => isString(rawManifest.type, 'type'),

    () => isObject(rawManifest.status, 'status'),
    () => validateRules(rawManifest.status, 'status'),

    () => isObject(rawManifest.config, 'config'),
    () => validateRules(rawManifest.config, 'config'),
  ]);
}

function checkFiles(files: string[] | undefined): string | undefined {
  if (typeof files === 'undefined') return;

  return sequence(files.map((file) => () => isLocalPath(file, 'files')));
}

function validateManifestBase(rawManifest: {[index: string]: any}): string | undefined {
  return sequence([
    // () => required(rawManifest.baseDir, 'baseDir'),
    // () => isString(rawManifest.baseDir, 'baseDir'),

    () => required(rawManifest.name, 'name'),
    () => isString(rawManifest.name, 'name'),

    () => required(rawManifest.main, 'main'),
    () => isString(rawManifest.main, 'main'),
    () => isLocalPath(rawManifest.main, 'main'),

    () => isBoolean(rawManifest.system, 'system'),

    () => isStringArray(rawManifest.devices, 'devices'),
    () => isStringArray(rawManifest.drivers, 'drivers'),
    () => isStringArray(rawManifest.services, 'services'),
    () => isStringArray(rawManifest.devs, 'devs'),

    () => isStringArray(rawManifest.files, 'files'),
    () => checkFiles(rawManifest.files),

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
      if (manifestType === 'device') return validateDeviceManifest(manifest);

      return;
      // switch (manifestType) {
      //   case 'device':
      //     return validateDeviceManifest(manifest);
      //   case 'driver':
      //     return validateDriverManifest(manifest);
      //   case 'service':
      //     return validateServiceManifest(manifest);
      // }
    }
  ]);
}
