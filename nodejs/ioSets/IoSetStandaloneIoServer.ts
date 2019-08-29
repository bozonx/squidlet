import * as path from 'path';

import IoSet from '../../system/interfaces/IoSet';
import IoItem from '../../system/interfaces/IoItem';
import Os from '../../shared/Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import HostConfig from '../../system/interfaces/HostConfig';
import IoSetSrc from './IoSetSrc';
import StorageIo from '../../system/interfaces/io/StorageIo';
import {splitFirstElement} from '../../system/lib/strings';
import systemConfig from '../../system/config/systemConfig';
import {trimStart} from '../../system/lib/lodashLike';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import {getFileNameOfPath} from '../../shared/helpers';
import initializationConfig from '../../system/config/initializationConfig';


const initializationCfg = initializationConfig();


class IoServerStorageWrapper {
  private readonly envSetDir: string;


  constructor(envSetDir: string) {
    this.envSetDir = envSetDir;
  }


  makeWrapper(originalStorage: StorageIo): StorageIo {
    const originalReadFile = originalStorage.readFile.bind(originalStorage);

    originalStorage.readFile = (pathTo: string) => this.readFile(originalReadFile, pathTo);

    return originalStorage;
  }


  private readFile = async (
    originalReadFile: (pathTo: string) => Promise<string>,
    pathTo: string
  ): Promise<string> => {
    // if it isn't config or entity file - just load it.
    if (pathTo.indexOf(this.envSetDir) === -1) return originalReadFile(pathTo);

    const splat: string[] = pathTo.split(this.envSetDir);
    const relativePath: string = trimStart(splat[1], path.sep);

    if (!relativePath) throw new Error(`IoServerStorageWrapper.readFile: Can't read path "${pathTo}"`);

    const [envSetDir, restPath] = splitFirstElement(relativePath, path.sep);

    if (!restPath) throw new Error(`IoServerStorageWrapper.readFile: empty rest of path`);

    if (envSetDir === systemConfig.envSetDirs.configs) {
      return JSON.stringify(this.loadConfig(restPath));
    }

    return originalReadFile(pathTo);
  }

  /**
   * Get builtin config
   * @param configName - config name with ".json" extension
   */
  private loadConfig(configName: string): {[index: string]: any} {
    // cut extension
    const strippedName: string = getFileNameOfPath(configName);

    if (strippedName === initializationCfg.fileNames.hostConfig) {
      // TODO: return host config
    }
    else if (strippedName === initializationCfg.fileNames.iosDefinitions) {
      // TODO: return iosDefinitons
    }

    //const config: any = (this.envSet && this.envSet.configs as any)[strippedName];

    throw new Error(`IoServerStorageWrapper.loadConfig: Can't find config "${configName}"`);
  }

}


/**
 * Io set which is used in standalone IO server.
 * It just gets host config from memory.
 */
export default class IoSetStandaloneIoServer extends IoSetSrc implements IoSet {
  private readonly hostConfig: HostConfig;

  // TODO: нужно:
  //   - hostConfig.ioServer
  //   - hostConfig.config.rcResponseTimoutSec
  //   - ios config
  constructor(os: Os, hostConfig: HostConfig, platform: Platforms, machine: string) {
    super(os, platform, machine);

    this.hostConfig = hostConfig;
  }

  async prepare() {
  }

  protected makeInstance(IoItemClass: new () => IoItem, ioName: string): IoItem {
    // make wrapper of Storage to get configs and manifests from memory
    if (ioName === 'Storage') {
      return this.storageWrapper.makeWrapper(new IoItemClass() as StorageIo);
    }
    else {
      return new IoItemClass();
    }
  }

}
