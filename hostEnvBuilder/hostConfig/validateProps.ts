import SchemaElement from '../../host/interfaces/SchemaElement';
import {whiteList} from './validationHelpers';
import {isValueOfType} from '../../host/helpers/typesHelpers';


export default function validateProps (
  props: {[index: string]: any},
  schema?: {[index: string]: SchemaElement}
): string | undefined {
  if (!schema) return;

  const whiteListErr: string | undefined = whiteList(props, Object.keys(schema), 'props');

  if (whiteListErr) return whiteListErr;

  for (let name of Object.keys(props)) {
    const typeErr: string | undefined = isValueOfType(schema[name].type, props[name]);

    if (typeErr) return `prop "${name}": typeErr`;
  }

  return;
}
