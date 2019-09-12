import {TriggersManager} from '../TriggersManager';
import {ActionsManager} from '../ActionsManager';


export default interface RuleItem {
  name: string;
  triggers: TriggersManager;
  actions: ActionsManager;
}
