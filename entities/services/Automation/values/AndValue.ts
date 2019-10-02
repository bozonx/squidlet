import Context from 'system/Context';
import ValueDefinition from '../interfaces/ValueDefinition';
import allValues, {ValueFunction} from './allValues';


interface AndDefinition extends ValueDefinition {
  check: ValueDefinition[];
}


export default function (context: Context, definition: AndDefinition): boolean {
  // TODO: use makeValue
  // TODO: use promise

  for (let valueDefinition of definition.check) {
    if (!allValues[valueDefinition.type]) {
      throw new Error(`Automation AndValue: can't find a value function of "${valueDefinition.type}"`);
    }

    const result: any = allValues[valueDefinition.type](context, valueDefinition);

    if (!result) return false;
  }

  return true;
}
