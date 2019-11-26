import ServiceBase from 'system/base/ServiceBase';
import StorageIo from 'system/interfaces/io/StorageIo';
import {pathJoin} from 'system/lib/paths';
import systemConfig from 'system/systemConfig';


interface Props {
}


const BUNDLE_SUB_DIR = 'bundle';
const BUNDLE_PREV_DIR = 'prev';
const BUNDLE_FILE_NAME = 'bundle.js';
const BUNDLE_SUM_FILE_NAME = 'bundle.sum.js';
const bundleRootDir = pathJoin(systemConfig.rootDirs.envSet, BUNDLE_SUB_DIR);
const bundlePrevDir = pathJoin(bundleRootDir, BUNDLE_PREV_DIR);


export default class Updater extends ServiceBase<Props> {
  private get storage(): StorageIo {
    return this.context.getIo('Storage') as any;
  }


  async init() {
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

    const fileExits = await this.storage.exists(bundlePath);

    if (fileExits) {
      //const fileExits = await this.storage.exists(bundlePath);
      // TODO: удалитьстарые bundle
      // TODO: переместить старый бандл в tmp

    }

    await this.storage.writeFile(bundlePath, bundleContent);
    await this.storage.writeFile(bundleSumPath, hashSum);
  }

  private updaterApi = {
    uploadBundle: this.updateBundle,
    getBundleHashSum: this.getBundleHashSum,
  };

}
