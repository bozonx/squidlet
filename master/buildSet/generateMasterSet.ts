import MasterConfig from '../MasterConfig';
import HostConfig, {HostConfigConfig} from '../../host/src/app/interfaces/HostConfig';
import {FilesSet} from '../interfaces/HostFilesSet';


interface MasterSetConfig extends HostConfigConfig {
  filesSet: FilesSet;
}

export interface MasterSet extends HostConfig {
  config: MasterSetConfig;
}


export default function (config: MasterConfig): MasterSet {
  // TODO: generate files paths and configs to js object in memory

  // TODO: get platform config

}
