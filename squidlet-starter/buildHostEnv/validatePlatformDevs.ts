import _difference = require('lodash/difference');

import MainHostsEnv from './MainHostsEnv';
import {Dependencies, EntitiesNames} from './entities/EntitiesCollection';
import {ManifestsTypePluralName} from '../../host/src/app/interfaces/ManifestTypes';



/**
 * Get list of devs used on host
 */
function getHostDevs(hostEntitiesNames: EntitiesNames, devDeps: Dependencies): string[] {
  const result: {[index: string]: true} = {};

  for (let pluralName of Object.keys(hostEntitiesNames)) {
    for (let entityName of hostEntitiesNames[pluralName as ManifestsTypePluralName]) {
      const deps: string[] | undefined = devDeps[pluralName as ManifestsTypePluralName][entityName];

      if (deps) {
        for (let dep of deps) {
          result[dep] = true;
        }
      }
    }
  }

  return Object.keys(result);
}


/**
 * Check that all the host's dev dependencies exist in platform devs list.
 */
export default function validatePlatformDevs (main: MainHostsEnv) {
  for (let hostId of main.masterConfig.getHostsIds()) {
    const hostEntitiesNames: EntitiesNames = main.hostClassNames.getEntitiesNames(hostId);
    const hostDevs: string[] = getHostDevs(hostEntitiesNames, main.entities.getDevDependencies());
    const platformDevs: string[] = main.masterConfig.getHostPlatformDevs(hostId);

    const notRegisteredHostDevs: string[] = _difference(hostDevs, platformDevs);

    if (notRegisteredHostDevs.length) {
      throw new Error(`Not registered dev dependencies "${JSON.stringify(notRegisteredHostDevs)}"
         of host "${hostId}" have been found.`);
    }
  }
}
