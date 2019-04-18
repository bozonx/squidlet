import * as ts from "typescript";


export default function (module: string): any {
  let result = ts.transpile(module);

  return eval(result);
}
