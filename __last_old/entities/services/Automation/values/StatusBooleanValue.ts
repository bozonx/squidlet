import Context from 'system/Context';
import {JsonTypes} from 'system/interfaces/Types';
import {Dictionary} from 'system/interfaces/Types';
import {StateCategories} from 'system/interfaces/States';
import {DEFAULT_DEVICE_STATUS} from 'system/constants';
import {invertIfNeed} from 'system/lib/digitalHelpers';
import ValueDefinition from '../interfaces/ValueDefinition';


interface StatusBooleanDefinition extends ValueDefinition {
  id: string;
  statusName: string;
  invert?: boolean;
}


export default function (context: Context, definition: StatusBooleanDefinition): boolean {
  const state: Dictionary | undefined = context.state.getState(StateCategories.devicesStatus, definition.id);

  if (!state) return false;

  const value: JsonTypes | undefined = (definition.statusName)
    ? state[definition.statusName]
    : state[DEFAULT_DEVICE_STATUS];

  return invertIfNeed(Boolean(value), definition.invert);
}
