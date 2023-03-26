import StatusBooleanValue from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/values/StatusBooleanValue.js';
import StatusValue from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/values/StatusValue.js';
import AndValue from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/values/AndValue.js';
import OrValue from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/values/OrValue.js';
import Context from 'src/system/Context';
import {JsonTypes} from '../squidlet-lib/src/interfaces/Types';
import Value from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/values/Value.js';


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
