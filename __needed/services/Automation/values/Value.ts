import Context from 'src/system/Context';
import {JsonTypes} from '../squidlet-lib/src/interfaces/Types';
import ValueDefinition from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Automation/interfaces/ValueDefinition.js';


interface ValueValueDefinition extends ValueDefinition {
  value?: JsonTypes;
}


export default function (context: Context, definition: ValueValueDefinition): JsonTypes | undefined {
  return definition.value;
}
