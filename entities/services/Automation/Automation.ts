import ServiceBase from 'system/base/ServiceBase';


type TriggerTypes = 'deviceState' | 'automation' | 'mqtt' | 'http' | 'I2C';
type ActionTypes = 'action' | 'automation' | 'mqtt' | 'http';

interface AutomationTrigger {
  type: TriggerTypes;
}

interface AutomationAction {
  type: ActionTypes;
}

interface AutomationRule {
  // optional name. If set you can access to it by name
  name?: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
}

interface Props {
  rules: AutomationRule[];
}


export default class Automation extends ServiceBase<Props> {
  protected didInit = async () => {
  }

}
