import EntityManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityManifest.js';


export default interface ServiceManifest extends EntityManifest {
  // is it system service or regular
  system?: boolean;
}
