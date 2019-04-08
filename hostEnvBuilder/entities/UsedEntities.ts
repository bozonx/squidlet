import _omit = require('lodash/omit');
import _defaultsDeep = require('lodash/defaultsDeep');

import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import ConfigManager from '../hostConfig/ConfigManager';
import HostEntitySet, {HostEntitiesSet} from '../interfaces/HostEntitySet';
import Register from './Register';
import PreManifestBase from '../interfaces/PreManifestBase';
import ManifestBase from '../../host/interfaces/ManifestBase';
import SchemaElement from '../../host/interfaces/SchemaElement';
import validateRules from '../hostConfig/validateRules';


const baseParamName = '$base';


// lists of names of all the entities
export interface EntitiesNames {
  devices: string[];
  drivers: string[];
  services: string[];
}


export default class UsedEntities {
  private readonly configManager: ConfigManager;
  private readonly register: Register;
  // devs which are used, like {devName: true}
  private usedDevs: {[index: string]: true} = {};
  private entitiesSet: HostEntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };


  constructor(configManager: ConfigManager, register: Register) {
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
      'devs',
      'props'
    );

    let props: {[index: string]: SchemaElement} | undefined;

    try {
      props = this.mergePropsSchema(preManifest.props);
    }
    catch (err) {
      throw new Error(`Can't merge props of "${preManifest.name}": ${err}`);
    }

    if (props) {
      // const validateError: string | undefined = validateRules(
      //   props,
      //   `${preManifest.name}.props`
      // );
      //
      // if (validateError) {
      //   throw new Error(`Invalid props of ${preManifest.name}: ${validateError}`);
      // }

      finalManifest.props = props;
    }

    return finalManifest;
  }

  /**
   * Read $base param and merge props with base props
   */
  private mergePropsSchema(props: {[index: string]: any} | undefined): {[index: string]: SchemaElement} | undefined {
    if (!props) return;
    // no necessary to merge
    if (!props[baseParamName]) return props;

    const [rawPluralType, entityName] = props[baseParamName].split('.');
    const pluralType: ManifestsTypePluralName = rawPluralType;
    const topLayer = _omit(props, baseParamName);

    if (!pluralType || !entityName) {
      throw new Error(`Invalid "$base" param of props. "${JSON.stringify(props)}"`);
    }

    const bottomLayer: {[index: string]: SchemaElement} | undefined = this.resolveEntityProps(
      pluralType,
      entityName
    );

    if (typeof bottomLayer === 'undefined') return topLayer;

    // merge
    return _defaultsDeep({} , topLayer, bottomLayer);
  }

  private resolveEntityProps(
    pluralType: ManifestsTypePluralName,
    entityName: string
  ): {[index: string]: SchemaElement} | undefined {
    const entitySet: HostEntitySet | undefined = this.entitiesSet[pluralType][entityName];

    // try to get previously resolved entity
    // return props or undefined
    if (entitySet) return entitySet.manifest.props;

    // else get from register

    const manifest: PreManifestBase = this.register.getEntityManifest(pluralType, entityName);

    if (!manifest.props) return;

    return this.mergePropsSchema(manifest.props);
  }

}
