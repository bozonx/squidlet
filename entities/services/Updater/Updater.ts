import ServiceBase from 'system/base/ServiceBase';
import StorageIo from 'system/interfaces/io/StorageIo';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';
import BundleUpdate from './BundleUpdate';


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
    this.context.system.apiManager.registerEndpoint('updater', this.updaterApi);
  }

  private updaterApi = {
    startBundleTransaction: this.bundleUpdate.startBundleTransaction,
    finishBundleTransaction: this.bundleUpdate.finishBundleTransaction,
    writeBundleChunk: this.bundleUpdate.writeBundleChunk,
    getBundleHashSum: this.bundleUpdate.getBundleHashSum,
  };

}
