import Context from 'system/Context';
import ValueDefinition from '../interfaces/ValueDefinition';
import {makeValue} from './allValues';


interface AndDefinition extends ValueDefinition {
  check: ValueDefinition[];
}


export default function (context: Context, definition: AndDefinition): boolean | Promise<boolean> {
  for (let valueDefinition of definition.check) {
    const result: any = makeValue(context, valueDefinition.type);

    // TODO: если вернулся promise - то все далее проверяем по очереди с промисами
    // TODO: поидее порядок выполнения не важен поэтому можно все выполнить одновременно

    if (!result) return false;
  }

  return true;
}
