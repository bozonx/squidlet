import Context from 'src/system/Context';

import ValueDefinition from '../interfaces/ValueDefinition';
import {makeValue} from './allValues';
import {invertIfNeed} from '../../../../../../squidlet-lib/src/digitalHelpers';


interface AndDefinition extends ValueDefinition {
  check: ValueDefinition[];
  invert?: boolean;
}


const resolveAndValue = (context: Context, check: ValueDefinition[]) => {
  for (let valueDefinition of check) {
    const result: any = makeValue(context, valueDefinition);

    // TODO: если вернулся promise - то все далее проверяем по очереди с промисами
    // TODO: поидее порядок выполнения не важен поэтому можно все выполнить одновременно

    if (!result) return false;
  }

  return true;
};


export default function (context: Context, definition: AndDefinition): boolean | Promise<boolean> {
  return invertIfNeed(resolveAndValue(context, definition.check), definition.invert);
}
