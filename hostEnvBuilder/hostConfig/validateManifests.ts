import _trim = require('lodash/trim');

import {ManifestsTypeName} from '../../host/interfaces/ManifestTypes';
import {
  isBoolean,
  isLocalPath,
  isObject,
  isString,
  isStringArray,
  required,
  sequence, whiteList
} from './validationHelpers';


const basicTypes: string[] = [
  'string',
  'string[]',
  'number',
  'number[]',
  'boolean',
  'boolean[]',
];

const constants: string[] = [
  'true',
  'false',
  'null',
  'undefined',
];


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

function validateDriverManifest(rawManifest: {[index: string]: any}): string | undefined {
  return sequence([
    () => required(rawManifest.type, 'type'),
    () => isString(rawManifest.type, 'type'),
  ]);
}

function checkFiles(files: string[] | undefined): string | undefined {
  if (typeof files === 'undefined') return;

  return sequence(files.map((file) => () => isLocalPath(file, 'files')));
}

function checkType(type: string | undefined, ruleName: string): string | undefined {
  if (typeof type === 'undefined') return;
  else if (typeof type !== 'string' && typeof type !== 'number') {
    return `type param of rule "${ruleName}" is not string or number`;
  }

  const types: string[] = String(type).split('|').map((item) => _trim(item));

  for (let item of types) {
    // numbers
    if (!Number.isNaN(Number(item))) continue;
    // constants
    else if (constants.includes(item)) continue;
    // string constants
    else if (item.match(/^['"][\w\d\s\-\_\$]+['"]$/)) continue;
    // basic types
    else if (!basicTypes.includes(item)) {
      return `type param of rule "${ruleName}" has incorrect type: "${item}"`;
    }
  }

  return;
}

function checkDefault(type: string | undefined, ruleName: string): string | undefined {
  // TODO: значение должно соответствовать типу
  return;
}

function checkRules(rules: {[index: string]: any} | undefined, paramName: string): string | undefined {
  if (typeof rules === 'undefined') return;

  for (let ruleName of Object.keys(rules)) {
    if (typeof rules[ruleName] !== 'object') {
      return `Incorrect type of rule "${ruleName}" of param "${paramName}": "${JSON.stringify(rules[ruleName])}"`;
    }

    const error: string | undefined = sequence([
      () => required(rules[ruleName].type, `${paramName}.${ruleName}.type`),
      () => checkType(rules[ruleName].type, `${paramName}.${ruleName}`),
      () => checkDefault(rules[ruleName].default, `${paramName}.${ruleName}`),
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

    () => required(rawManifest.name, 'name'),
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
