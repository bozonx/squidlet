import Context from 'system/Context';
import ValueDefinition from '../interfaces/ValueDefinition';
import {makeValue} from './allValues';


interface OrDefinition extends ValueDefinition {
  check: ValueDefinition[];
}


export default function (context: Context, definition: OrDefinition): boolean {
  for (let valueDefinition of definition.check) {
    const result: any = makeValue(context, valueDefinition);

    // TODO: если вернулся promise - то все далее проверяем по очереди с промисами

    if (result) return true;
  }

  return false;
}
