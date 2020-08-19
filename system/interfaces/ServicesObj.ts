import {SharedStorage} from '../../entities/services/SharedStorage/SharedStorage';
import Automation from '../../entities/services/Automation/Automation';


export default interface ServicesObj {
  sharedStorage: SharedStorage;
  automation: Automation;
  [index: string]: any;
}
