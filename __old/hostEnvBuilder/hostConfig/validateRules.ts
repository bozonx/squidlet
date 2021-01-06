import {
  isBoolean,
  required,
  sequence
} from './validationHelpers';
import SchemaElement from '../../../src/interfaces/SchemaElement';
import {parseType} from '../../system/lib/typesHelpers';
import {isValueOfType, whiteList} from '../../system/lib/validate';


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

function checkDefault(rule: SchemaElement, ruleName: string): string | undefined {
  if (typeof rule.default === 'undefined') return;

  const error: string | undefined = isValueOfType(rule.type, rule.default);

  if (error) return `Rule's "${ruleName}": "${JSON.stringify(rule)}" default param doesn't correspond to its type`;

  return;
}


export default function validateRules(rules: {[index: string]: SchemaElement} | undefined, paramName: string): string | undefined {
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
