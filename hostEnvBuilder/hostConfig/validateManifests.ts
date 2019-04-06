import {ManifestsTypeName} from '../../host/interfaces/ManifestTypes';
import {
  isBoolean,
  isLocalPath,
  isObject,
  isString,
  isStringArray,
  required,
  sequence
} from './validationHelpers';
import SchemaElement from '../../host/interfaces/SchemaElement';
import {parseType} from '../../host/helpers/typesHelpers';
import {isValueOfType, whiteList} from '../../host/helpers/validate';



function validateDeviceManifest(rawManifest: {[index: string]: any}): string | undefined {
  return sequence([
    () => required(rawManifest.type, 'type'),
    () => isString(rawManifest.type, 'type'),

    () => isObject(rawManifest.status, 'status'),
    () => checkRules(rawManifest.status, 'status'),

    () => isObject(rawManifest.config, 'config'),
    () => checkRules(rawManifest.config, 'config'),
  ]);
}

// function validateDriverManifest(rawManifest: {[index: string]: any}): string | undefined {
//   return sequence([
//     () => required(rawManifest.type, 'type'),
//     () => isString(rawManifest.type, 'type'),
//   ]);
// }

function checkFiles(files: string[] | undefined): string | undefined {
  if (typeof files === 'undefined') return;

  return sequence(files.map((file) => () => isLocalPath(file, 'files')));
}

function checkType(type: string | undefined, ruleName: string): string | undefined {
  if (typeof type === 'undefined') return;

  try {
    parseType(type);
  }
  catch (err) {
    return `Incorrect type "${type}" of rule "${ruleName}": ${String(err)}`;
  }

  return;
}

function checkDefault(rule: SchemaElement, ruleName: string): string | undefined {
  if (typeof rule.default === 'undefined') return;

  const error: string | undefined = isValueOfType(rule.type, rule.default);

  if (error) return `Rule's "${ruleName}": "${JSON.stringify(rule)}" default param doesn't correspond to its type`;

  return;
}

function checkRules(rules: {[index: string]: SchemaElement} | undefined, paramName: string): string | undefined {
  if (typeof rules === 'undefined') return;

  for (let ruleName of Object.keys(rules)) {
    if (typeof rules[ruleName] !== 'object') {
      return `Incorrect type of rule "${ruleName}" of param "${paramName}": "${JSON.stringify(rules[ruleName])}"`;
    }

    const error: string | undefined = sequence([
      () => required(rules[ruleName].type, `${paramName}.${ruleName}.type`),
      () => checkType(rules[ruleName].type, `${paramName}.${ruleName}`),
      () => checkDefault(rules[ruleName], `${paramName}.${ruleName}`),
      () => isBoolean(rules[ruleName].required, `${paramName}.${ruleName}.required`),
      () => whiteList(rules[ruleName], [
        'type',
        'default',
        'required',
      ], `${paramName}.${ruleName}`),
    ]);

    // default

    if (error) return error;
  }

  return;
}

function validateManifestBase(rawManifest: {[index: string]: any}): string | undefined {
  return sequence([
    () => required(rawManifest.baseDir, 'baseDir'),
    () => isString(rawManifest.baseDir, 'baseDir'),

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
    () => checkRules(rawManifest.props, 'props'),
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
