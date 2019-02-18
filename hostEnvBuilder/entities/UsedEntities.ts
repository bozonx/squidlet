import _omit = require('lodash/omit');
import * as path from 'path';

import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import ConfigManager from '../ConfigManager';
import SrcEntitiesSet, {SrcEntitySet} from '../interfaces/SrcEntitiesSet';
import Register from './Register';
import PreManifestBase from '../interfaces/PreManifestBase';
import ManifestBase from '../../host/interfaces/ManifestBase';
import Io from '../Io';


// lists of names of all the entities
export interface EntitiesNames {
  devices: string[];
  drivers: string[];
  services: string[];
}


export default class UsedEntities {
  private readonly io: Io;
  private readonly configManager: ConfigManager;
  private readonly register: Register;
  // devs which are used, like {devName: true}
  private usedDevs: {[index: string]: true} = {};
  private entitiesSet: SrcEntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };


  constructor(io: Io, configManager: ConfigManager, register: Register) {
    this.io = io;
    this.register = register;
    this.configManager = configManager;
  }


  async generate() {
    await this.proceedDefinitions('devices', this.configManager.preHostConfig.devices);
    await this.proceedDefinitions('drivers', this.configManager.preHostConfig.drivers);
    await this.proceedDefinitions('services', this.configManager.preHostConfig.services);
  }

  getUsedDevs(): string[] {
    return Object.keys(this.usedDevs);
  }

  getEntitiesSet(): SrcEntitiesSet {
    return this.entitiesSet;
  }

  getEntitySet(pluralType: ManifestsTypePluralName, name: string): SrcEntitySet {
    return this.entitiesSet[pluralType][name];
  }

  // TODO: может сделать отдельные методы ещё ???
  /**
   * Generate class names of all the used entities
   */
  getEntitiesNames(): EntitiesNames {
    return {
      devices: Object.keys(this.entitiesSet.devices),
      drivers: Object.keys(this.entitiesSet.drivers),
      services: Object.keys(this.entitiesSet.services),
    };

    // const result: EntitiesNames = {
    //   devices: [],
    //   drivers: [],
    //   services: [],
    // };
    //
    // // collect manifest names of used entities
    // const devicesClasses = this.getDevicesClassNames();
    // const allDriversClasses: string[] = this.getAllUsedDriversClassNames();
    // const servicesClasses: string[] = this.getServicesClassNames();
    //
    // const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
    //   for (let className of classes) {
    //     result[pluralType].push(className);
    //   }
    // };
    //
    // collect('devices', devicesClasses);
    // collect('drivers', allDriversClasses);
    // collect('services', servicesClasses);
    //
    // return result;
  }


  /**
   * Proceed definitions of devices of drivers or services specified in host config
   */
  private async proceedDefinitions(
    pluralType: ManifestsTypePluralName,
    definitions?: {[index: string]: PreEntityDefinition}
  ) {
    if (!definitions) return;

    for (let entityId of Object.keys(definitions)) {
      const className: string = definitions[entityId].className;

      await this.proceedEntity(pluralType, className);
    }
  }

  private async proceedEntity(pluralType: ManifestsTypePluralName, className: string) {
    // skip if it is proceeded
    if (this.entitiesSet[pluralType][className]) return;

    const preManifest: PreManifestBase = this.register.getEntityManifest(pluralType, className);

    // save entity set which is made of manifest
    this.entitiesSet[pluralType][className] = await this.makeSrcEntitySet(preManifest);

    // resolve devices deps
    for (let depClassName of preManifest.devices || []) {
      await this.proceedEntity('devices', depClassName);
    }
    // resolve drivers deps
    for (let depClassName of preManifest.drivers || []) {
      await this.proceedEntity('drivers', depClassName);
    }
    // resolve drivers deps
    for (let depClassName of preManifest.services || []) {
      await this.proceedEntity('services', depClassName);
    }

    // collect devs
    for (let depClassName of preManifest.devs || []) {
      this.usedDevs[depClassName] = true;
    }
  }

  private async makeSrcEntitySet(preManifest: PreManifestBase): Promise<SrcEntitySet> {
    const finalManifest: ManifestBase = await this.finalizeManifest(preManifest);

    return {
      srcDir: preManifest.baseDir,
      manifest: finalManifest,
      main: preManifest.main,
      files: preManifest.files || [],
      system: preManifest.system || false,
    };
  }

  private async finalizeManifest(preManifest: PreManifestBase): Promise<ManifestBase> {
    const finalManifest: ManifestBase = _omit<any>(
      preManifest,
      'files',
      'main',
      'system',
      'baseDir',
      'devices',
      'drivers',
      'devs'
    );

    // load props file
    if (typeof preManifest.props === 'string') {
      const propPath = path.join(preManifest.baseDir, preManifest.props);
      finalManifest.props = await this.io.loadYamlFile(propPath);
    }

    return finalManifest;
  }

}
