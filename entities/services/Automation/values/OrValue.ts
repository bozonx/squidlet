import Context from 'system/Context';
import ValueDefinition from '../interfaces/ValueDefinition';
import allValues from './allValues';


interface OrDefinition {
  check: ValueDefinition[];
}


export default function (context: Context, definition: OrDefinition): boolean {
  for (let valueDefinition of definition.check) {
    if (!allValues[valueDefinition.type]) {
      throw new Error(`Automation OrValue: can't find a value function "${valueDefinition.type}"`);
    }

    const result: any = allValues[valueDefinition.type](context, valueDefinition);

    if (result) return true;
  }

  return false;
}
