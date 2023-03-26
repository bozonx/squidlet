import Context from 'src/system/Context';
import {JsonTypes} from '../squidlet-lib/src/interfaces/Types';
import {Dictionary} from '../squidlet-lib/src/interfaces/Types';
import {StateCategories} from '__old/system/interfaces/States';
import {DEFAULT_DEVICE_STATUS} from '__old/system/constants';
import ValueDefinition from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/ValueDefinition.js';


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
