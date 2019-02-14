import {ManifestsTypeName, ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import ConfigManager from '../ConfigManager';
import SrcEntitiesSet from '../interfaces/SrcEntitiesSet';
import Register from './Register';
import PreManifestBase from '../interfaces/PreManifestBase';


export default class UsedEntities {
  private readonly configManager: ConfigManager;
  private readonly register: Register;
  private entitiesSet: SrcEntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };

  constructor(register: Register, configManager: ConfigManager) {
    this.register = register;
    this.configManager = configManager;
  }


  async generate() {
    await this.proceedDefinitions('device', this.configManager.preHostConfig.devices);
    await this.proceedDefinitions('driver', this.configManager.preHostConfig.drivers);
    await this.proceedDefinitions('service', this.configManager.preHostConfig.services);

    // TODO: резолвим их зависимости и загружаем
  }

  /**
   * Proceed definitions of devices of drivers or services specified in host conifg
   * @param manifestType
   * @param definitions
   */
  async proceedDefinitions(
    manifestType: ManifestsTypeName,
    definitions?: {[index: string]: PreEntityDefinition}
  ) {
    if (!definitions) return;

    for (let entityId of Object.keys(definitions)) {
      const className: string = definitions[entityId].className;

      await this.proceedEntity(manifestType, className);
    }
  }

  async proceedEntity(manifestType: ManifestsTypeName, className: string) {
    const pluralType = `${manifestType}s` as ManifestsTypePluralName;

    const manifest: PreManifestBase = this.register.getEntityManifest();
    // TODO: load manifest
  }

}
