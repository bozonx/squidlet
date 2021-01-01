import StatusBooleanValue from './StatusBooleanValue';
import StatusValue from './StatusValue';
import AndValue from './AndValue';
import OrValue from './OrValue';
import Context from '__old/system/Context';
import {JsonTypes} from '__old/system/interfaces/Types';
import Value from './Value';


export type ValueFunctionReturnType = (JsonTypes | undefined) | Promise<JsonTypes | undefined>;
export type ValueFunction = (context: Context, definition: any) => ValueFunctionReturnType;

const allValues: {[index: string]: ValueFunction} = {
  and: AndValue,
  or: OrValue,
  statusBoolean: StatusBooleanValue,
  status: StatusValue,
  value: Value,
};


export function makeValue(context: Context, valueDefinition: any): ValueFunctionReturnType {
  if (!allValues[valueDefinition.type]) {
    throw new Error(`Automation: can't find a value function of "${valueDefinition.type}"`);
  }

  return allValues[valueDefinition.type](context, valueDefinition);
}


export default allValues;
