import StatusBooleanValue from './StatusBooleanValue';
import StatusValue from './StatusValue';
import AndValue from './AndValue';
import OrValue from './OrValue';
import Context from 'system/Context';


export type ValueFunction = (context: Context, definition: any) => any;

const allValues: {[index: string]: ValueFunction} = {
  andValue: AndValue,
  orValue: OrValue,
  statusBoolean: StatusBooleanValue,
  status: StatusValue,
};


export default allValues;
