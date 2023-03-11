import EntityManifest from '../../../__idea2021/src/interfaces/EntityManifest';


export default interface ServiceManifest extends EntityManifest {
  // is it system service or regular
  system?: boolean;
}
