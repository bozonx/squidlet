import Context from 'system/Context';
import {JsonTypes} from 'system/interfaces/Types';
import {Dictionary} from 'system/interfaces/Types';
import {StateCategories} from 'system/interfaces/States';
import {DEFAULT_DEVICE_STATUS} from 'system/constants';
import ValueDefinition from '../interfaces/ValueDefinition';


interface StatusDefinition extends ValueDefinition {
  id: string;
  statusName: string;
}


export default function (context: Context, definition: StatusDefinition): JsonTypes | undefined {
  const state: Dictionary | undefined = context.state.getState(StateCategories.devicesStatus, definition.id);

  if (!state) return;

  if (!definition.statusName) return state[DEFAULT_DEVICE_STATUS];

  return state[definition.statusName];
}
