import {ManifestsTypeName} from '../../host/interfaces/ManifestTypes';
import {sequence} from './validationHelpers';


function validateDeviceManifest(rawManifest: {[index: string]: any}): string | undefined {
  // TODO: add
  return undefined;
}

function validateDriverManifest(rawManifest: {[index: string]: any}): string | undefined {
  // TODO: add
  return undefined;
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

function validateServiceManifest(rawManifest: {[index: string]: any}): string | undefined {
  // TODO: add
  return undefined;
}

function validateManifestBase(rawManifest: {[index: string]: any}): string | undefined {
  // TODO: add
  return undefined;
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
          return validateServiceManifest(manifest);
      }
    }
  ]);
}
