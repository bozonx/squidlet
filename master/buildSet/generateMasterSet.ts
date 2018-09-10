import MasterConfig from '../MasterConfig';
import HostConfig, {HostConfigConfig} from '../../host/src/app/interfaces/HostConfig';
import {FilesSet} from '../interfaces/HostFilesSet';


interface MasterSetConfig extends HostConfigConfig {
  filesSet: FilesSet;
}

export interface MasterSet extends HostConfig {
  // TODO: наверное это просто ссылка на файл который потом загрузится по запросу уже в host system
  config: MasterSetConfig;
}


// TODO: список путей на сбилженные конфиги и на original enitity main and other files мастера


export default function (config: MasterConfig): MasterSet {
  // TODO: generate files paths and configs to js object in memory

  // TODO: get platform config

}
