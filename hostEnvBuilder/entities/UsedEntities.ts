import {ManifestsTypeName, ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import ConfigManager from '../ConfigManager';
import SrcEntitiesSet from '../interfaces/SrcEntitiesSet';
import Register from './Register';
import PreManifestBase from '../interfaces/PreManifestBase';
import PreDeviceManifest from '../interfaces/PreDeviceManifest';
import PreDriverManifest from '../interfaces/PreDriverManifest';
import PreServiceManifest from '../interfaces/PreServiceManifest';


interface Manifests {
  devices: {[index: string]: PreDeviceManifest};
  drivers: {[index: string]: PreDriverManifest};
  services: {[index: string]: PreServiceManifest};
}


export default class UsedEntities {
  private readonly configManager: ConfigManager;
  private readonly register: Register;
  private manifests: Manifests = {
    devices: {},
    drivers: {},
    services: {},
  };
  // private entitiesSet: SrcEntitiesSet = {
  //   devices: {},
  //   drivers: {},
  //   services: {},
  // };

  constructor(register: Register, configManager: ConfigManager) {
    this.register = register;
    this.configManager = configManager;
  }


  async generate() {
    await this.proceedDefinitions('device', this.configManager.preHostConfig.devices);
    await this.proceedDefinitions('driver', this.configManager.preHostConfig.drivers);
    await this.proceedDefinitions('service', this.configManager.preHostConfig.services);
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
    const manifest: PreManifestBase = await this.register.getEntityManifest(manifestType, className);

    this.manifests[pluralType][className] = manifest;

    // TODO: резолвим их зависимости и загружаем
  }

}
