import _omit = require('lodash/omit');
import _cloneDeep = require('lodash/cloneDeep');

import PreHostConfig from '../interfaces/PreHostConfig';
import {defaultServices, servicesShortcut} from '../dict/dict';
import systemConfig from '../configs/systemConfig';
import {ManifestsTypeName} from '../../system/interfaces/ManifestTypes';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';


/**
 * Make devices plain. Converts {room: {device1: {device: 'MyDevice'}}}
 * to {
 *    'room.device1': {
 *      device: 'MyDevice'
 *    },
 *  }
 */
function makeDevicesPlain(preDevices?: {[index: string]: any}): {[index: string]: any} {
  if (!preDevices) return {};

  const result: {[index: string]: any} = {};

  const recursively = (root: string, preDevicesOrRoom: {[index: string]: any}) => {
    if (typeof preDevicesOrRoom !== 'object') {
      throw new Error(`Invalid type of device "${root}"`);
    }

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
function convertDefinitions(
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
function collectServicesFromShortcuts(
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


function getDefinitionClassName(type: ManifestsTypeName, id: string, preDefinitions: PreEntityDefinition): string {
  if (type === 'driver') {
    return id;
  }

  return preDefinitions[type];
}

function makeDefaultServices(
  preHostConfig: PreHostConfig,
  existentServices: {[index: string]: any}
): {[index: string]: any} {
  const fullServices: {[index: string]: any} = _cloneDeep(existentServices);

  for(let serviceId of defaultServices) {
    // if it has a definition of is disabled - do nothing
    if (fullServices[serviceId] || (preHostConfig as any)[serviceId] === null) continue;

    const serviceClassName: string | undefined = servicesShortcut[serviceId];

    if (!serviceClassName) {
      throw new Error(`Can't find full service name of "${serviceId}"`);
    }

    // make default service definition if is hasn't been defined
    fullServices[serviceId] = {
      className: serviceClassName,
    };
  }

  return fullServices;
}


/**
 * Make devices plain, fill services from shortcuts and convert drivers and devices definitions
 */
export default function normalizeHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
  const plainDevices: {[index: string]: any} = makeDevicesPlain(preHostConfig.devices);
  const services = {
    ...convertDefinitions('service', preHostConfig.services || {}),
    // make services from shortcut
    ...collectServicesFromShortcuts(preHostConfig, servicesShortcut),
  };

  return {
    ..._omit(preHostConfig, Object.keys(servicesShortcut)),
    devices: convertDefinitions('device', plainDevices),
    drivers: convertDefinitions('driver', preHostConfig.drivers || {}),

    // TODO: test it

    services: makeDefaultServices(preHostConfig, services),
  };
}
