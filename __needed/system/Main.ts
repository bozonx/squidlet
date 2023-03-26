import IoSet from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoSet.js';
import HostConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/HostConfig.js';
import StorageIo from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';
import SysIo from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/SysIo.js';
import {APP_DESTROY_TIMEOUT_SEC, SystemEvents} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/constants.js';
import Logger from '../../../squidlet-networking/src/interfaces/Logger';
import System from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/System.js';
import LogLevel from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/LogLevel.js';


/**
 * It prepares ioSet, connects logger and starts system
 */
export default class Main {
  // TODO: review может лучше брать из System ?
  get hasBeenStarted(): boolean {
    return this.started;
  }

  private ioSet: IoSet;
  private hostConfigOverride?: Partial<HostConfig>;
  private logger: Logger;
  private system?: System;
  private started: boolean = false;


  constructor(
    ioSet: IoSet,
    logger: Logger,
    hostConfigOverride?: Partial<HostConfig>
  ) {
    this.ioSet = ioSet;
    this.hostConfigOverride = hostConfigOverride;
    this.logger = logger;
  }

  async init() {
    this.system = new System(this.ioSet, this.hostConfigOverride);

    delete this.hostConfigOverride;

    this.ioSet.init && await this.ioSet.init();
  }

  destroy(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject(`App destroy timeout has been exceeded.`);
      }, APP_DESTROY_TIMEOUT_SEC * 1000);

      this.doDestroy()
        .then(resolve)
        .catch(reject);
    });
  }


  /**
   * Start app or IoServer
   */
  async start() {
    if (!this.system) throw new Error(`No system`);

    this.system.addListener(SystemEvents.logger, (level: LogLevel, message: string) => {
      this.logger[level](message);
    });

    await this.system.start();

    this.started = true;
  }

  /**
   * Configure local Storage IO and Sys IO.
   * Don't call it if remote IO set is used.
   * @param processExit
   * @param workDir
   * @param uid
   * @param gid
   */
  async configureIoSet(
    processExit: (code: number) => void,
    workDir?: string,
    uid?: number,
    gid?: number
  ) {
    // get Storage IO
    const storageIo: StorageIo = this.ioSet.getIo<StorageIo>('Storage');
    const sysIo: SysIo = this.ioSet.getIo<SysIo>('Sys');
    // set uid, git and workDir to Storage IO
    await storageIo.configure({ uid, gid, workDir });
    // make destroy before process.exit
    await sysIo.configure({
      exit: (code: number) => {
        this.destroy()
          .then(() => processExit(code))
          .catch((e: Error) => {
            this.logger.error(String(e));
            processExit(code);
          });
      }
    });
  }

  private async doDestroy() {
    if (!this.system) throw new Error('No system');

    try {
      await this.system.destroy();
    }
    catch (e) {
      this.logger.error(e);
    }

    this.logger.info(`... destroying IoSet`);

    try {
      await this.ioSet.destroy();
    }
    catch (e) {
      this.logger.error(e);
    }
    finally {
      delete this.ioSet;
      delete this.system;
      delete this.logger;
    }
  }

}
