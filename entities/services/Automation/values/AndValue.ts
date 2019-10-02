import Context from 'system/Context';
import ValueDefinition from '../interfaces/ValueDefinition';


interface AndDefinition {
  check: ValueDefinition[];
}


export default function (context: Context, definition: AndDefinition): boolean {
  for (let valueDefinition of definition.check) {

  }

  return true;
}
