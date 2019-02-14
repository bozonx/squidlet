import _omit = require('lodash/omit');
import * as path from 'path';

import {ManifestsTypeName, ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import ConfigManager from '../ConfigManager';
import SrcEntitiesSet, {SrcEntitySet} from '../interfaces/SrcEntitiesSet';
import Register from './Register';
import PreManifestBase from '../interfaces/PreManifestBase';
import ManifestBase from '../../host/interfaces/ManifestBase';
import Io from '../Io';


export default class UsedEntities {
  private readonly io: Io;
  private readonly configManager: ConfigManager;
  private readonly register: Register;
  // devs whisch are used, like {devName: true}
  private usedDevs: {[index: string]: true} = {};
  private entitiesSet: SrcEntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };

  constructor(io: Io, register: Register, configManager: ConfigManager) {
    this.io = io;
    this.register = register;
    this.configManager = configManager;
  }


  async generate() {
    await this.proceedDefinitions('device', this.configManager.preHostConfig.devices);
    await this.proceedDefinitions('driver', this.configManager.preHostConfig.drivers);
    await this.proceedDefinitions('service', this.configManager.preHostConfig.services);
  }


  /**
   * Proceed definitions of devices of drivers or services specified in host config
   */
  private async proceedDefinitions(
    manifestType: ManifestsTypeName,
    definitions?: {[index: string]: PreEntityDefinition}
  ) {
    if (!definitions) return;

    for (let entityId of Object.keys(definitions)) {
      const className: string = definitions[entityId].className;

      await this.proceedEntity(manifestType, className);
    }
  }

  private async proceedEntity(manifestType: ManifestsTypeName, className: string) {
    const pluralType = `${manifestType}s` as ManifestsTypePluralName;

    // skip if it is proceeded
    if (this.entitiesSet[pluralType][className]) return;

    const preManifest: PreManifestBase = await this.register.getEntityManifest(manifestType, className);

    // save entity set which is made of manifest
    this.entitiesSet[pluralType][className] = await this.makeSrcEntitySet(preManifest);

    // resolve devices deps
    for (let depClassName of preManifest.devices || []) {
      await this.proceedEntity('device', depClassName);
    }
    // resolve drivers deps
    for (let depClassName of preManifest.drivers || []) {
      await this.proceedEntity('driver', depClassName);
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
    };
  }

  private async finalizeManifest(preManifest: PreManifestBase): Promise<ManifestBase> {
    const finalManifest: ManifestBase = _omit<any>(
      preManifest,
      'files',
      'main',
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
