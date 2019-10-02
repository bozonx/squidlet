import Context from 'system/Context';
import ValueDefinition from '../interfaces/ValueDefinition';
import allValues from './allValues';


interface AndDefinition {
  check: ValueDefinition[];
}


export default function (context: Context, definition: AndDefinition): boolean {
  for (let valueDefinition of definition.check) {
    if (!allValues[valueDefinition.type]) {
      throw new Error(`Automation AndValue: can't find a value function "${valueDefinition.type}"`);
    }

    const result: any = allValues[valueDefinition.type](context, valueDefinition);

    if (!result) return false;
  }

  return true;
}
