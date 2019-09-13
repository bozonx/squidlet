import {evaluate} from 'bcx-expression-evaluator';


export default async function runExpr(expression: string, scope: {[index: string]: any}) {
  return await evaluate(expression, scope);
}
