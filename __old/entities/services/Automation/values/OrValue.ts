import Context from '__old/system/Context';

import ValueDefinition from '../interfaces/ValueDefinition';
import {makeValue} from './allValues';
import {invertIfNeed} from '../../../../../../squidlet-lib/src/digitalHelpers';


interface OrDefinition extends ValueDefinition {
  check: ValueDefinition[];
  invert?: boolean;
}

const resolveOrValue = (context: Context, check: ValueDefinition[]) => {
  for (let valueDefinition of check) {
    const result: any = makeValue(context, valueDefinition);

    // TODO: если вернулся promise - то все далее проверяем по очереди с промисами

    if (result) return true;
  }

  return false;
};


export default function (context: Context, definition: OrDefinition): boolean {
  return invertIfNeed(resolveOrValue(context, definition.check), definition.invert);
}
