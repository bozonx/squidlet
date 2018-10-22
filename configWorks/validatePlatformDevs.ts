const _difference = require('lodash/difference');

import Main from './Main';
import {EntitiesNames} from './Entities';


/**
 * Check that all the host's dev dependencies exist in platform devs list.
 */
export default function validatePlatformDevs (main: Main) {
  for (let hostId of main.masterConfig.getHostsIds()) {
    const hostEntitiesNames: EntitiesNames = this.getEntitiesNames(hostId);
    const hostDevs: string[] = this.getHostDevs(hostEntitiesNames);
    const platformDevs: string[] = main.masterConfig.getHostPlatformDevs(hostId);

    const notRegisteredHostDevs: string[] = _difference(hostDevs, platformDevs);

    if (notRegisteredHostDevs.length) {
      throw new Error(`Not registered dev dependencies "${JSON.stringify(notRegisteredHostDevs)}"
         of host "${hostId}" have been found.`);
    }
  }
}
