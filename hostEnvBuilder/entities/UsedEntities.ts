import _omit = require('lodash/omit');
import * as path from 'path';

import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import ConfigManager from '../hostConfig/ConfigManager';
import HostEntitySet, {HostEntitiesSet} from '../interfaces/HostEntitySet';
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
  private entitiesSet: HostEntitiesSet = {
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
    await this.proceedDefinitions('devices', this.configManager.preEntities.devices);
    await this.proceedDefinitions('drivers', this.configManager.preEntities.drivers);
    await this.proceedDefinitions('services', this.configManager.preEntities.services);
  }

  getUsedDevs(): string[] {
    return Object.keys(this.usedDevs);
  }

  getEntitiesSet(): HostEntitiesSet {
    return this.entitiesSet;
  }

  getEntitySet(pluralType: ManifestsTypePluralName, name: string): HostEntitySet {
    return this.entitiesSet[pluralType][name];
  }

  /**
   * Generate class names of all the used entities
   */
  getEntitiesNames(): EntitiesNames {
    return {
      devices: Object.keys(this.entitiesSet.devices),
      drivers: Object.keys(this.entitiesSet.drivers),
      services: Object.keys(this.entitiesSet.services),
    };
  }

  async addEntity(pluralType: ManifestsTypePluralName, className: string) {
    await this.proceedEntity(pluralType, className);
  }


  /**
   * Proceed definitions of devices of drivers or services specified in host config
   */
  private async proceedDefinitions(
    pluralType: ManifestsTypePluralName,
    definitions: {[index: string]: PreEntityDefinition}
  ) {
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
    this.entitiesSet[pluralType][className] = await this.makeEntitySet(preManifest);

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

  private async makeEntitySet(preManifest: PreManifestBase): Promise<HostEntitySet> {
    const finalManifest: ManifestBase = await this.finalizeManifest(preManifest);

    return {
      srcDir: preManifest.baseDir,
      manifest: finalManifest,
      files: preManifest.files || [],
      system: preManifest.system || false,
    };
  }

  private async finalizeManifest(preManifest: PreManifestBase): Promise<ManifestBase> {
    const finalManifest: ManifestBase = _omit<any>(
      preManifest,
      'files',
      'system',
      'baseDir',
      'devices',
      'drivers',
      'devs'
    );

    // TODO: clean up it after validation

    // clear path to main file
    finalManifest.main = preManifest.main.replace(/^\.+\//, '');

    // load props file
    if (typeof preManifest.props === 'string') {
      const propPath = path.join(preManifest.baseDir, preManifest.props);
      finalManifest.props = await this.io.loadYamlFile(propPath);
    }

    return finalManifest;
  }

}
