import {pathJoin} from 'system/lib/paths';
import systemConfig from 'system/systemConfig';
import Context from 'system/Context';
import StorageIo from '../../../system/interfaces/io/StorageIo';


let transactionLastId: number = 0;
const BUNDLE_SUB_DIR = 'bundle';
const BUNDLE_PREV_DIR = 'prev';
export const BUNDLE_FILE_NAME = 'bundle.js';
export const BUNDLE_SUM_FILE_NAME = 'bundle.sum';
// size of chunk. Default is 32kb.
export const BUNDLE_CHUNK_SIZE_BYTES = 32768;
const bundleRootDir = pathJoin(systemConfig.rootDirs.envSet, BUNDLE_SUB_DIR);
const bundlePrevDir = pathJoin(bundleRootDir, BUNDLE_PREV_DIR);
const bundleSumPath = pathJoin(bundleRootDir, BUNDLE_SUM_FILE_NAME);


export default class BundleUpdate {
  private readonly context: Context;
  private readonly storage: StorageIo;
  private currentBundleTransactionId?: number;
  private uploadingBundleLength?: number;
  private receiveChunksLength?: number;


  constructor(context: Context, storage: StorageIo) {
    this.context = context;
    this.storage = storage;
  }


  async init() {
    // make sub dir
    try {
      await this.storage.mkdir(bundleRootDir);
      await this.storage.mkdir(bundlePrevDir);
    }
    catch (e) {
    }
  }


  /**
   * Return bundle's hash sum if it exists
   */
  getBundleHashSum = async (): Promise<string | undefined> => {
    const bundleSumPath = pathJoin(bundleRootDir, BUNDLE_SUM_FILE_NAME);
    const fileExits = await this.storage.exists(bundleSumPath);

    if (!fileExits) return;

    return await this.storage.readFile(bundleSumPath);
  }

  /**
   * Start bundle update transaction and return transaction id.
   */
  startBundleTransaction = async (bundleLength: number): Promise<number> => {
    if (typeof this.currentBundleTransactionId !== 'undefined') {
      await this.revertBundle();
    }

    this.uploadingBundleLength = bundleLength;

    const transactionId: number =  this.makeNewTransactonId();

    // TODO: start timeout

    this.currentBundleTransactionId = transactionId;

    return transactionId;
  }

  finishBundleTransaction = async (transactionId: number, hashSum: string) => {
    if (transactionId !== this.currentBundleTransactionId) {
      await this.revertBundle();

      throw new Error(`Bad transactionId: ${transactionId}, current is ${this.currentBundleTransactionId}`);
    }
    else if (this.uploadingBundleLength !== this.receiveChunksLength) {
      await this.revertBundle();

      throw new Error(`Bad received bundle: bad length ${this.receiveChunksLength} bun it has to be ${this.uploadingBundleLength}`);
    }

    delete this.currentBundleTransactionId;
    delete this.uploadingBundleLength;
    delete this.receiveChunksLength;

    // success:
    this.context.log.info(`Updater: Received bundle check sum. ${hashSum}. Will be written to ${bundleRootDir}`);
    await this.rotateBundle();
    this.context.log.debug(`Updater: write bundle sum ${bundleSumPath}`);
    await this.storage.writeFile(bundleSumPath, hashSum);
  }

  /**
   * Upload while bundle which is contains system, entities and config.
   */
  writeBundleChunk = async (transactionId: number, bundleChunk: string, chunkNum: number) => {
    // TODO: update timeout before each chunk
    // TODO: write chunks to tmp file name
    // TODO: следить за порядком

    if (transactionId !== this.currentBundleTransactionId) {
      throw new Error(`Bad transactionId: ${transactionId}, current is ${this.currentBundleTransactionId}`);
    }

    this.context.log.info(`Updater: Received bundle chunk. Will be written to ${bundleRootDir}`);

    // TODO: check hasNext

    const bundlePath = pathJoin(bundleRootDir, BUNDLE_FILE_NAME);

    this.context.log.debug(`Updater: write ${bundlePath}`);
    // TODO: use append
    await this.storage.writeFile(bundlePath, bundleChunk);

    delete this.currentBundleTransactionId;
  }


  // TODO: review
  private async rotateBundle() {
    const bundlePath = pathJoin(bundleRootDir, BUNDLE_FILE_NAME);
    const bundleSumPath = pathJoin(bundleRootDir, BUNDLE_SUM_FILE_NAME);
    const prevBundlePath = pathJoin(bundlePrevDir, BUNDLE_FILE_NAME);
    const prevBundleSumPath = pathJoin(bundlePrevDir, BUNDLE_SUM_FILE_NAME);
    const currentBundleExits = await this.storage.exists(bundlePath);
    const currentBundleSumExits = await this.storage.exists(bundleSumPath);

    // TODO: move received tmp bundle to normal position

    // remove prev version
    if (await this.storage.exists(prevBundlePath)) await this.storage.unlink(prevBundlePath);
    if (await this.storage.exists(prevBundleSumPath)) await this.storage.unlink(prevBundleSumPath);

    if (!currentBundleExits && !currentBundleSumExits) {
      // do nothing if there aren't current bundle
      return;
    }
    else if (currentBundleExits && !currentBundleSumExits) {
      // something wrong - remove useless file and do nothing
      this.context.log.warn(`Updater: current bundle exists but sum file doesn't`);
      await this.storage.unlink(bundlePath);

      return;
    }
    else if (!currentBundleExits && currentBundleSumExits) {
      // something wrong - remove useless file and do nothing
      this.context.log.warn(`Updater: sum of current bundle exists but the bundle doesn't`);
      await this.storage.unlink(bundleSumPath);

      return;
    }
    // move bundle files
    await this.storage.rename(bundlePath, prevBundlePath);
    await this.storage.rename(bundleSumPath, prevBundleSumPath);
  }

  private makeNewTransactonId(): number {
    transactionLastId++;

    return transactionLastId;
  }

  private async revertBundle() {
    // TODO: remove partly received bundle
    // TODO: remove timeout

    delete this.currentBundleTransactionId;
    delete this.uploadingBundleLength;
    delete this.receiveChunksLength;
  }

}
