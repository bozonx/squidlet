import ValueDefinition from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/ValueDefinition.js';

export type TriggerTypes = 'deviceState' | 'automation' | 'mqtt' | 'http' | 'I2C';
export type ActionTypes = 'deviceAction' | 'automation' | 'mqtt' | 'http';


export interface TriggerDefinition {
  type: TriggerTypes;
}

export interface ActionDefinition {
  type: ActionTypes;
}


export default interface RuleDefinition {
  // optional name. If set you can access to it by name
  name?: string;
  trigger: TriggerDefinition[];
  action: ActionDefinition[];
  if?: ValueDefinition[];
}
