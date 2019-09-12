type TriggerTypes = 'deviceState' | 'automation' | 'mqtt' | 'http' | 'I2C';
type ActionTypes = 'deviceAction' | 'automation' | 'mqtt' | 'http';


interface TriggerDefinition {
  type: TriggerTypes;
}

interface ActionDefinition {
  type: ActionTypes;
}


export default interface RuleDefinition {
  // optional name. If set you can access to it by name
  name?: string;
  trigger: TriggerDefinition;
  action: ActionDefinition;
}
