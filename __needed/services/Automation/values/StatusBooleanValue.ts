import Context from 'src/system/Context';
import {JsonTypes} from '../squidlet-lib/src/interfaces/Types';
import {Dictionary} from '../squidlet-lib/src/interfaces/Types';
import {StateCategories} from '__old/system/interfaces/States';
import {DEFAULT_DEVICE_STATUS} from '__old/system/constants';
import {invertIfNeed} from '../squidlet-lib/src/digitalHelpers';
import ValueDefinition from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/ValueDefinition.js';


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
