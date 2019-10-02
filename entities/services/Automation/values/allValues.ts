import StatusBooleanValue from './StatusBooleanValue';
import StatusValue from './StatusValue';
import AndValue from './AndValue';
import OrValue from './OrValue';
import Context from 'system/Context';
import {JsonTypes} from '../../../../system/interfaces/Types';


export type ValueFunction = (context: Context, definition: any) => JsonTypes | undefined;

const allValues: {[index: string]: ValueFunction} = {
  andValue: AndValue,
  orValue: OrValue,
  statusBoolean: StatusBooleanValue,
  status: StatusValue,
};


export function makeValue(context: Context, valueDefinition: any): JsonTypes | undefined {
  if (!allValues[valueDefinition.type]) {
    throw new Error(`Automation DeviceAction: can't find a value function of "${valueDefinition.type}"`);
  }

  return allValues[valueDefinition.type](context, valueDefinition);
}


export default allValues;
