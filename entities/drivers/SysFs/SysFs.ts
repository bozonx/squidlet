import StorageDev, {Stats} from 'host/interfaces/dev/StorageDev';
import DriverBase from 'host/baseDrivers/DriverBase';


export default class SysFs extends DriverBase {
  private get storageDev(): StorageDev {
    return this.depsInstances.storageDev as StorageDev;
  }


  protected willInit = async () => {
    this.depsInstances.storageDev = this.env.getDev('Storage');
  }


}
