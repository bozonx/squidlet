export interface BooleanCondition {
  type: string;
}


export default interface ConditionDefinition {
  type: string;
  check: BooleanCondition[];
}
