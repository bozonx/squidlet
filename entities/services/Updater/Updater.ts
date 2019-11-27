import ServiceBase from 'system/base/ServiceBase';
import StorageIo from 'system/interfaces/io/StorageIo';
import {pathJoin} from 'system/lib/paths';
import systemConfig from 'system/systemConfig';


interface Props {
}


const BUNDLE_SUB_DIR = 'bundle';
const BUNDLE_PREV_DIR = 'prev';
export const BUNDLE_FILE_NAME = 'bundle.js';
export const BUNDLE_SUM_FILE_NAME = 'bundle.sum';
const bundleRootDir = pathJoin(systemConfig.rootDirs.envSet, BUNDLE_SUB_DIR);
const bundlePrevDir = pathJoin(bundleRootDir, BUNDLE_PREV_DIR);


export default class Updater extends ServiceBase<Props> {
  private get storage(): StorageIo {
    return this.context.getIo('Storage') as any;
  }


  init = async () => {
    this.context.system.apiManager.registerEndpoint('updater', this.updaterApi);
    // make sub dir
    try {
      await this.storage.mkdir(bundlePrevDir);
    }
    catch (e) {
    }
  }

  /**
   * Return bundle's hash sum if it exists
   */
  private getBundleHashSum = async (): Promise<string | undefined> => {
    const bundleSumPath = pathJoin(bundleRootDir, BUNDLE_SUM_FILE_NAME);
    const fileExits = await this.storage.exists(bundleSumPath);

    if (!fileExits) return;

    return await this.storage.readFile(bundleSumPath);
  }

  /**
   * Upload while bundle which is contains system, entities and config.
   */
  private updateBundle = async (bundleContent: string, hashSum: string) => {
    const bundlePath = pathJoin(bundleRootDir, BUNDLE_FILE_NAME);
    const bundleSumPath = pathJoin(bundleRootDir, BUNDLE_SUM_FILE_NAME);

    await this.rotateBundle();

    await this.storage.writeFile(bundlePath, bundleContent);
    await this.storage.writeFile(bundleSumPath, hashSum);
  }

  private updaterApi = {
    updateBundle: this.updateBundle,
    getBundleHashSum: this.getBundleHashSum,
  };


  private async rotateBundle() {
    const bundlePath = pathJoin(bundleRootDir, BUNDLE_FILE_NAME);
    const bundleSumPath = pathJoin(bundleRootDir, BUNDLE_SUM_FILE_NAME);
    const prevBundlePath = pathJoin(bundlePrevDir, BUNDLE_FILE_NAME);
    const prevBundleSumPath = pathJoin(bundlePrevDir, BUNDLE_SUM_FILE_NAME);
    const currentBundleExits = await this.storage.exists(bundlePath);
    const currentBundleSumExits = await this.storage.exists(bundleSumPath);

    // remove prev version
    if (await this.storage.exists(prevBundlePath)) await this.storage.unlink(prevBundlePath);
    if (await this.storage.exists(prevBundleSumPath)) await this.storage.unlink(prevBundleSumPath);

    if (!currentBundleExits && !currentBundleSumExits) {
      // do nothing if there aren't current bundle
      return;
    }
    else if (currentBundleExits && !currentBundleSumExits) {
      // something wrong - remove useless file and do nothing
      this.log.warn(`Updater: current bundle exists but sum file doesn't`);
      await this.storage.unlink(bundlePath);

      return;
    }
    else if (!currentBundleExits && currentBundleSumExits) {
      // something wrong - remove useless file and do nothing
      this.log.warn(`Updater: sum of current bundle exists but the bundle doesn't`);
      await this.storage.unlink(bundleSumPath);

      return;
    }
    // move bundle files
    await this.storage.rename(bundlePath, prevBundlePath);
    await this.storage.rename(bundleSumPath, prevBundleSumPath);
  }

}
