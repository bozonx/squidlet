import ServiceBase from 'src/base/ServiceBase';
import StorageIo from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';
import Context from 'src/system/Context';
import EntityDefinition from 'src/interfaces/EntityDefinition';
import BundleUpdate from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Updater/BundleUpdate.js';


interface Props {
}


export default class Updater extends ServiceBase<Props> {
  private readonly bundleUpdate: BundleUpdate;
  private get storage(): StorageIo {
    return this.context.getIo('Storage') as any;
  }


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    this.bundleUpdate = new BundleUpdate(context, this.storage);
  }


  init = async () => {
    const updaterApi = {
      startBundleTransaction: this.bundleUpdate.startBundleTransaction,
      finishBundleTransaction: this.bundleUpdate.finishBundleTransaction,
      writeBundleChunk: this.bundleUpdate.writeBundleChunk,
      getBundleHashSum: this.bundleUpdate.getBundleHashSum,
    };

    this.context.system.apiManager.registerEndpoint('updater', updaterApi);

    await this.bundleUpdate.init();
  }

}
