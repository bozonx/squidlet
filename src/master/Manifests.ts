import DeviceManifest from './interfaces/DeviceManifest';

export default class Manifests {
  private devices: DeviceManifest;

  constructor() {

  }

  resolve() {
    // TODO: пройтись по всем манифестам и искать там drivers
    // TODO: рукурсивно проходиться по полям drivers в манифестах драйверов
  }

}
