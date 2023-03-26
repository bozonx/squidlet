import {pathJoin} from '../squidlet-lib/src/paths';
import systemConfig from '__old/system/systemConfig';
import Context from 'src/system/Context';
import StorageIo from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';


let transactionLastId: number = 0;
export const BUNDLE_FILE_NAME = 'bundle.js';
export const BUNDLE_SUM_FILE_NAME = 'bundle.sum';
// size of chunk. Default is 32kb.
export const BUNDLE_CHUNK_SIZE_BYTES = 32768;
const BUNDLE_ROOT_DIR = pathJoin(systemConfig.rootDirs.envSet, 'bundle');
const BUNDLE_PREV_DIR = pathJoin(BUNDLE_ROOT_DIR, 'prev');
const BUNDLE_TMP_FILE_PATH = pathJoin(BUNDLE_ROOT_DIR, 'bundle.tmp.js');
const BUNDLE_PATH = pathJoin(BUNDLE_ROOT_DIR, BUNDLE_FILE_NAME);
const BUNDLE_SUM_FILE_PATH = pathJoin(BUNDLE_ROOT_DIR, BUNDLE_SUM_FILE_NAME);


export default class BundleUpdate {
  private readonly context: Context;
  private readonly storage: StorageIo;
  private currentBundleTransactionId?: number;
  private uploadingBundleLength?: number;
  private receivedChunksLength?: number;


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
    this.context.log.info(`Starting update bundle transaction. Bundle length ${Math.round(bundleLength / 1024)}kb`);

    // revert bundle in case there is current uploading
    await this.revertBundle();

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
    else if (this.uploadingBundleLength !== this.receivedChunksLength) {
      await this.revertBundle();

      throw new Error(`Bad received bundle: bad length ${this.receivedChunksLength} but it has to be ${this.uploadingBundleLength}`);
    }

    delete this.currentBundleTransactionId;
    delete this.uploadingBundleLength;
    delete this.receivedChunksLength;

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
    const expectedChunkNum = this.expectedChunkNum();

    if (transactionId !== this.currentBundleTransactionId) {
      await this.revertBundle();

      throw new Error(`Bad transactionId: ${transactionId}, current is ${this.currentBundleTransactionId}`);
    }
    else if (chunkNum !== expectedChunkNum) {
      await this.revertBundle();

      throw new Error(`Bad chunk num: ${chunkNum} but expected ${expectedChunkNum}`);
    }

    this.context.log.info(`Updater: Received bundle chunk. Will be written to ${BUNDLE_ROOT_DIR}`);
    this.context.log.debug(`Updater: appending chunk to ${BUNDLE_TMP_FILE_PATH}`);

    try {
      await this.storage.appendFile(BUNDLE_TMP_FILE_PATH, bundleChunk);
    }
    catch (e) {
      await this.revertBundle();

      throw e;
    }

    // TODO: update timeout before each chunk

    this.receivedChunksLength = (this.receivedChunksLength || 0) + bundleChunk.length;
  }


  private async rotateBundle() {
    const prevBundlePath = pathJoin(BUNDLE_PREV_DIR, BUNDLE_FILE_NAME);
    const prevBUNDLE_SUM_FILE_PATH = pathJoin(BUNDLE_PREV_DIR, BUNDLE_SUM_FILE_NAME);
    const currentBundleExits = await this.storage.exists(BUNDLE_PATH);
    const currentBundleSumExits = await this.storage.exists(BUNDLE_SUM_FILE_PATH);
    let needToMoveCurrentBundle: boolean = true;

    // remove prev version
    if (await this.storage.exists(prevBundlePath)) await this.storage.unlink(prevBundlePath);
    if (await this.storage.exists(prevBUNDLE_SUM_FILE_PATH)) await this.storage.unlink(prevBUNDLE_SUM_FILE_PATH);

    if (!currentBundleExits && !currentBundleSumExits) {
      // do nothing if there aren't current bundle
      needToMoveCurrentBundle = false;
    }
    else if (currentBundleExits && !currentBundleSumExits) {
      // something wrong - remove useless file and do nothing
      this.context.log.warn(`Updater: current bundle exists but sum file doesn't`);
      await this.storage.unlink(BUNDLE_PATH);
      needToMoveCurrentBundle = false;
    }
    else if (!currentBundleExits && currentBundleSumExits) {
      // something wrong - remove useless file and do nothing
      this.context.log.warn(`Updater: sum of current bundle exists but the bundle doesn't`);
      await this.storage.unlink(BUNDLE_SUM_FILE_PATH);
      needToMoveCurrentBundle = false;
    }

    if (needToMoveCurrentBundle) {
      // move current bundle files
      await this.storage.rename(BUNDLE_PATH, prevBundlePath);
      await this.storage.rename(BUNDLE_SUM_FILE_PATH, prevBUNDLE_SUM_FILE_PATH);
    }

    await this.storage.rename(BUNDLE_TMP_FILE_PATH, BUNDLE_PATH);
  }

  private makeNewTransactonId(): number {
    transactionLastId++;

    return transactionLastId;
  }

  /**
   * Get number of chunk which is expected.
   * Number starts from 0.
   */
  private expectedChunkNum(): number {
    // something wrong
    if (typeof this.uploadingBundleLength === 'undefined') return -1;
    else if (!this.receivedChunksLength) return 0;

    const receivedChunks = Math.ceil(this.receivedChunksLength / BUNDLE_CHUNK_SIZE_BYTES);

    return receivedChunks;
  }

  private async revertBundle() {
    // TODO: remove timeout

    delete this.currentBundleTransactionId;
    delete this.uploadingBundleLength;
    delete this.receivedChunksLength;

    if (await this.storage.exists(BUNDLE_TMP_FILE_PATH)) {
      await this.storage.unlink(BUNDLE_TMP_FILE_PATH);
    }
  }

}
