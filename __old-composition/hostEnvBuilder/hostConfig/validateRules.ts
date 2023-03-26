import {
  isBoolean,
  required,
  sequence
} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/validationHelpers.js';
import PropElement from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/PropElement.js';
import {parseType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/typesHelpers.js';
import {isValueOfType, whiteList} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/validate.js';


function checkType(type: string | undefined, ruleName: string): string | undefined {
  if (typeof type === 'undefined') return;

  try {
    parseType(type);
  }
  catch (err) {
    return `Incorrect type "${type}" of rule "${ruleName}": ${String(err)}`;
  }

  return;
}

function checkDefault(rule: PropElement, ruleName: string): string | undefined {
  if (typeof rule.default === 'undefined') return;

  const error: string | undefined = isValueOfType(rule.type, rule.default);

  if (error) return `Rule's "${ruleName}": "${JSON.stringify(rule)}" default param doesn't correspond to its type`;

  return;
}


export default function validateRules(rules: {[index: string]: PropElement} | undefined, paramName: string): string | undefined {
  if (typeof rules === 'undefined') return;

  for (let ruleName of Object.keys(rules)) {
    if (typeof rules[ruleName] !== 'object') {
      return `Incorrect type of rule "${ruleName}" of param "${paramName}": "${JSON.stringify(rules[ruleName])}"`;
    }

    const error: string | undefined = sequence([
      () => required(rules[ruleName].type, `${paramName}.${ruleName}.type`),
      () => checkType(rules[ruleName].type, `${paramName}.${ruleName}`),
      () => checkDefault(rules[ruleName], `${paramName}.${ruleName}`),
      () => isBoolean(rules[ruleName].required, `${paramName}.${ruleName}.required`),
      () => whiteList(rules[ruleName], [
        'type',
        'default',
        'required',
      ], `${paramName}.${ruleName}`),
    ]);

    // default

    if (error) return error;
  }

  return;
}
