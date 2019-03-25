import _omit = require('lodash/omit');
import _difference = require('lodash/difference');

import systemConfig from './configs/systemConfig';
import {ManifestsTypeName} from '../host/interfaces/ManifestTypes';
import PreEntityDefinition from './interfaces/PreEntityDefinition';


/**
 * Return two arrays [included[], notIncluded[]].
 * @param wholeSet - all items
 * @param targetItems - target items which will be in "included" array
 */
export function sortByIncludeInList(wholeSet: string[], targetItems: string[]): [string[], string[]] {
  const included: string[] = [];
  const notIncluded: string[] = [];

  for (let item of wholeSet) {
    if (targetItems.indexOf(item) >= 0) {
      included.push(item);
    }
    else {
      notIncluded.push(item);
    }
  }

  return [
    included,
    notIncluded,
  ];
}

/**
 * Make devices plain. Converts {room: {device1: {device: 'MyDevice'}}}
 * to {
 *    'room.device1': {
 *      device: 'MyDevice'
 *    },
 *  }
 */
export function makeDevicesPlain(preDevices?: {[index: string]: any}): {[index: string]: any} {
  if (!preDevices) return {};

  const result: {[index: string]: any} = {};

  const recursively = (root: string, preDevicesOrRoom: {[index: string]: any}) => {
    if (preDevicesOrRoom.device) {
      // it's device definition
      result[root] = preDevicesOrRoom;

      return;
    }

    // else it's room - go deeper in room
    for (let itemName of Object.keys(preDevicesOrRoom)) {
      const newRoot = (root)
        ? [ root, itemName ].join(systemConfig.hostSysCfg.deviceIdSeparator)
        : itemName;
      recursively(newRoot, preDevicesOrRoom[itemName]);
    }
  };

  recursively('', preDevices);

  return result;
}

/**
 * Convert definition line { device: MyClass, ... } to { className: MyClass, ... }
 */
export function convertDefinitions(
  type: ManifestsTypeName,
  preDefinitions: {[index: string]: any}
): {[index: string]: PreEntityDefinition} {
  const definitions: {[index: string]: PreEntityDefinition} = {};

  for (let id of Object.keys(preDefinitions)) {
    definitions[id] = {
      ..._omit(preDefinitions[id], type),
      className: getDefinitionClassName(type, id, preDefinitions[id]),
    };
  }

  return definitions;
}

/**
 * Generate service from shortcuts like 'automation', 'logger' etc.
 */
export function collectServicesFromShortcuts(
  preHostConfig: {[index: string]: any},
  servicesShortcut: {[index: string]: string}
): {[index: string]: PreEntityDefinition} {
  const services: {[index: string]: PreEntityDefinition} = {};

  // collect services
  for (let serviceId of Object.keys(servicesShortcut)) {
    if (typeof preHostConfig[serviceId] === 'undefined') continue;

    // if it is empty then yaml parser will return null
    const definition: PreEntityDefinition = preHostConfig[serviceId] || {};

    services[serviceId] = {
      ...definition,
      className: servicesShortcut[serviceId],
    };
  }

  return services;
}

export function checkDevsExistance(hostDevs: string[], machineDevs: string[]) {
  const diff: string[] = _difference(hostDevs, machineDevs);

  if (diff.length) {
    throw new Error(`There aren't some devs "${JSON.stringify(diff)}" in the selected platform`);
  }
}


//////////////// PRIVATE ////////////////

function getDefinitionClassName(type: ManifestsTypeName, id: string, preDefinitions: PreEntityDefinition): string {
  if (type === 'driver') {
    return id;
  }

  return preDefinitions[type];
}
