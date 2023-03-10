import Context from 'system/Context';
import {JsonTypes} from 'system/interfaces/Types';
import ValueDefinition from '../interfaces/ValueDefinition';


interface ValueValueDefinition extends ValueDefinition {
  value?: JsonTypes;
}


export default function (context: Context, definition: ValueValueDefinition): JsonTypes | undefined {
  return definition.value;
}
