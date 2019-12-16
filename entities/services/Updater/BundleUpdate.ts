import {pathJoin} from 'system/lib/paths';
import systemConfig from 'system/systemConfig';
import Context from 'system/Context';
import StorageIo from '../../../system/interfaces/io/StorageIo';


let transactionLastId: number = 0;
export const BUNDLE_FILE_NAME = 'bundle.js';
export const BUNDLE_SUM_FILE_NAME = 'bundle.sum';
// size of chunk. Default is 32kb.
export const BUNDLE_CHUNK_SIZE_BYTES = 32768;
const BUNDLE_ROOT_DIR = pathJoin(systemConfig.rootDirs.envSet, 'bundle');
const BUNDLE_PREV_DIR = pathJoin(BUNDLE_ROOT_DIR, 'prev');
const BUNDLE_TMP_FILE_PATH = pathJoin(BUNDLE_ROOT_DIR, 'bundle.tmp.js');
const BUNDLE_SUM_FILE_PATH = pathJoin(BUNDLE_ROOT_DIR, BUNDLE_SUM_FILE_NAME);


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
      await this.storage.mkdir(BUNDLE_ROOT_DIR);
      await this.storage.mkdir(BUNDLE_PREV_DIR);
    }
    catch (e) {
    }
  }


  /**
   * Return bundle's hash sum if it exists
   */
  getBundleHashSum = async (): Promise<string | undefined> => {
    const BUNDLE_SUM_FILE_PATH = pathJoin(BUNDLE_ROOT_DIR, BUNDLE_SUM_FILE_NAME);
    const fileExits = await this.storage.exists(BUNDLE_SUM_FILE_PATH);

    if (!fileExits) return;

    return await this.storage.readFile(BUNDLE_SUM_FILE_PATH);
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
    this.context.log.info(`Updater: Received bundle check sum. ${hashSum}. Will be written to ${BUNDLE_ROOT_DIR}`);
    await this.rotateBundle();
    this.context.log.debug(`Updater: write bundle sum ${BUNDLE_SUM_FILE_PATH}`);
    await this.storage.writeFile(BUNDLE_SUM_FILE_PATH, hashSum);
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

    this.context.log.info(`Updater: Received bundle chunk. Will be written to ${BUNDLE_ROOT_DIR}`);

    // TODO: check hasNext

    const bundlePath = pathJoin(BUNDLE_ROOT_DIR, BUNDLE_FILE_NAME);

    this.context.log.debug(`Updater: write ${bundlePath}`);
    // TODO: use append
    await this.storage.writeFile(bundlePath, bundleChunk);

    delete this.currentBundleTransactionId;
  }


  // TODO: review
  private async rotateBundle() {
    const bundlePath = pathJoin(BUNDLE_ROOT_DIR, BUNDLE_FILE_NAME);
    const BUNDLE_SUM_FILE_PATH = pathJoin(BUNDLE_ROOT_DIR, BUNDLE_SUM_FILE_NAME);
    const prevBundlePath = pathJoin(BUNDLE_PREV_DIR, BUNDLE_FILE_NAME);
    const prevBUNDLE_SUM_FILE_PATH = pathJoin(BUNDLE_PREV_DIR, BUNDLE_SUM_FILE_NAME);
    const currentBundleExits = await this.storage.exists(bundlePath);
    const currentBundleSumExits = await this.storage.exists(BUNDLE_SUM_FILE_PATH);

    // TODO: move received tmp bundle to normal position

    // remove prev version
    if (await this.storage.exists(prevBundlePath)) await this.storage.unlink(prevBundlePath);
    if (await this.storage.exists(prevBUNDLE_SUM_FILE_PATH)) await this.storage.unlink(prevBUNDLE_SUM_FILE_PATH);

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
      await this.storage.unlink(BUNDLE_SUM_FILE_PATH);

      return;
    }
    // move bundle files
    await this.storage.rename(bundlePath, prevBundlePath);
    await this.storage.rename(BUNDLE_SUM_FILE_PATH, prevBUNDLE_SUM_FILE_PATH);
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
