import PreHostConfig from '../interfaces/PreHostConfig';
import {collectServicesFromShortcuts, convertDefinitions, makeDevicesPlain} from '../helpers';
import {servicesShortcut} from '../dict/dict';


/**
 * Make devices plain, fill services from shortcuts and convert drivers and devices definitions
 */
export default function normalizeHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
  const plainDevices: {[index: string]: any} = makeDevicesPlain(preHostConfig.devices);

  return {
    ...preHostConfig,
    devices: convertDefinitions('device', plainDevices),
    drivers: convertDefinitions('driver', preHostConfig.drivers || {}),
    services: {
      ...convertDefinitions('service', preHostConfig.services || {}),
      // make services from shortcut
      ...collectServicesFromShortcuts(preHostConfig, servicesShortcut),
    },
  };
}
