import _defaultsDeep = require('lodash/defaultsDeep');

import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import PreEntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreEntityDefinition.js';
import ConfigManager from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/ConfigManager.js';
import HostEntitySet, {HostEntitiesSet} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/HostEntitySet.js';
import Register from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/entities/Register.js';
import PreManifestBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreManifestBase.js';
import EntityManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityManifest.js';
import PropElement from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/PropElement.js';
import validateRules from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/validateRules.js';
import {convertEntityTypeToPlural} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';
import {convertEntityTypePluralToSingle} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/helpers.js';
import {omitObj} from '../../../../squidlet-lib/src/objects';


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
  // ios which are used, like {devName: true}
  private usedIos: {[index: string]: true} = {};
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
    await this.proceedDefinitions('device', this.configManager.preEntities.devices);
    await this.proceedDefinitions('driver', this.configManager.preEntities.drivers);
    await this.proceedDefinitions('service', this.configManager.preEntities.services);
  }

  getUsedIo(): string[] {
    return Object.keys(this.usedIos);
  }

  getEntitiesSet(): HostEntitiesSet {
    return this.entitiesSet;
  }

  // TODO: test
  /**
   * Get entites set without a "srcDir"
   */
  getProdEntitiesSet(): HostEntitiesSet {
    const prepareEntities = (entities: {[index: string]: HostEntitySet}): {[index: string]: HostEntitySet} => {
      const result: {[index: string]: HostEntitySet} = {};

      for (let entityName of Object.keys(entities)) {
        const clone = { ...entities[entityName] };

        delete clone.srcDir;

        result[entityName] = clone;
      }

      return result;
    };

    return {
      devices: prepareEntities(this.entitiesSet.devices),
      drivers: prepareEntities(this.entitiesSet.drivers),
      services: prepareEntities(this.entitiesSet.services),
    };
  }

  getEntitySet(entityType: EntityType, name: string): HostEntitySet {
    const entityTypePlural = convertEntityTypeToPlural(entityType);

    return this.entitiesSet[entityTypePlural][name];
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

  async addEntity(entityType: EntityType, className: string) {
    await this.proceedEntity(entityType, className);
  }


  /**
   * Proceed definitions of devices of drivers or services specified in host config
   */
  private async proceedDefinitions(
    entityType: EntityType,
    definitions: {[index: string]: PreEntityDefinition}
  ) {
    for (let entityId of Object.keys(definitions)) {
      const className: string = definitions[entityId].className;

      await this.proceedEntity(entityType, className);
    }
  }

  private async proceedEntity(entityType: EntityType, className: string) {
    const entityTypePlural = convertEntityTypeToPlural(entityType);

    // skip if it is proceeded
    if (this.entitiesSet[entityTypePlural][className]) return;

    const preManifest: PreManifestBase = this.register.getEntityManifest(entityType, className);

    // save entity set which is made of manifest
    this.entitiesSet[entityTypePlural][className] = await this.makeEntitySet(preManifest);

    // resolve devices deps
    for (let depClassName of preManifest.devices || []) {
      await this.proceedEntity('device', depClassName);
    }
    // resolve drivers deps
    for (let depClassName of preManifest.drivers || []) {
      await this.proceedEntity('driver', depClassName);
    }
    // resolve drivers deps
    for (let depClassName of preManifest.services || []) {
      await this.proceedEntity('service', depClassName);
    }

    // collect ios
    for (let depClassName of preManifest.ios || []) {
      this.usedIos[depClassName] = true;
    }
  }

  private async makeEntitySet(preManifest: PreManifestBase): Promise<HostEntitySet> {
    const finalManifest: EntityManifest = await this.finalizeManifest(preManifest);

    return {
      srcDir: preManifest.baseDir,
      manifest: finalManifest,
      files: preManifest.files || [],
      system: preManifest.system || false,
    };
  }

  private async finalizeManifest(preManifest: PreManifestBase): Promise<EntityManifest> {
    const finalManifest = omitObj(
      preManifest,
      'files',
      'system',
      'baseDir',
      'devices',
      'drivers',
      'ios',
      'props'
    ) as EntityManifest;

    let props: {[index: string]: PropElement} | undefined;

    try {
      props = this.mergePropsSchema(preManifest.props);
    }
    catch (err) {
      throw new Error(`Can't merge props of "${preManifest.name}": ${err}`);
    }

    if (props) {
      const validateError: string | undefined = validateRules(
        props,
        `${preManifest.name}.props`
      );

      if (validateError) {
        throw new Error(`Invalid props of ${preManifest.name}: ${validateError}`);
      }

      finalManifest.props = props;
    }

    return finalManifest;
  }

  /**
   * Read $base param and merge props with base props
   */
  private mergePropsSchema(props: {[index: string]: any} | undefined): {[index: string]: PropElement} | undefined {
    if (!props) return;
    // no necessary to merge
    if (!props[baseParamName]) return props;

    const [rawPluralType, entityName] = props[baseParamName].split('.');

    if (!rawPluralType || !entityName) {
      throw new Error(`Invalid "$base" param of props. "${JSON.stringify(props)}"`);
    }

    const entityType = convertEntityTypePluralToSingle(rawPluralType);
    const topLayer = omitObj(props, baseParamName);
    const bottomLayer: {[index: string]: PropElement} | undefined = this.resolveEntityProps(
      entityType,
      entityName
    );

    if (typeof bottomLayer === 'undefined') return topLayer;

    // merge
    return _defaultsDeep({} , topLayer, bottomLayer);
  }

  private resolveEntityProps(
    entityType: EntityType,
    entityName: string
  ): {[index: string]: PropElement} | undefined {
    const entityTypePlural = convertEntityTypeToPlural(entityType);
    const entitySet: HostEntitySet | undefined = this.entitiesSet[entityTypePlural][entityName];

    // try to get previously resolved entity
    // return props or undefined
    if (entitySet) return entitySet.manifest.props;

    // else get from register

    const manifest: PreManifestBase = this.register.getEntityManifest(entityType, entityName);

    if (!manifest.props) return;

    return this.mergePropsSchema(manifest.props);
  }

}
