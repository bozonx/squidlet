import {VarStorage} from '../../entities/services/VarStorage/SharedStorage';
import Automation from '../../entities/services/Automation/Automation';


export default interface ServicesObj {
  varStorage: VarStorage;
  automation: Automation;
  [index: string]: any;
}
