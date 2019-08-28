/**
 * Parse string numbers and constants to pure numbers and constants
 */
export function parseValue(rawValue: any): any {
  if (
    typeof rawValue === 'undefined'
    || rawValue === null
    || typeof rawValue === 'boolean'
    || Number.isNaN(rawValue)
    || rawValue === ''
  ) {
    return rawValue;
  }
  else if (rawValue === 'true') {
    return true;
  }
  else if (rawValue === 'false') {
    return false;
  }
  else if (rawValue === 'undefined') {
    return undefined;
  }
  else if (rawValue === 'null') {
    return null;
  }
  else if (rawValue === 'NaN') {
    return NaN;
  }
  // it is for - 2. strings
  else if (typeof rawValue === 'string' && rawValue.match(/^\d+\.$/)) {
    return rawValue;
  }

  const toNumber = parseFloat(rawValue);

  if (!Number.isNaN(toNumber)) {
    // it's number
    return toNumber;
  }

  if (typeof rawValue === 'string') {
    return rawValue;
  }

  // array or object - as is
  return rawValue;
}

/**
 * Call error-first callback functions like a promised
 */
export function callPromised(method: Function, ...params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      method(...params, (err: Error, data: any) => {
        if (err) return reject(err);

        resolve(data);
      });
    }
    catch (err) {
      reject(err);
    }
  });
}

/**
 * Is number or number as string.
 */
export function isKindOfNumber(value: any): boolean {
  if (typeof value === 'string') {
    return !Number.isNaN(Number(value));
  }

  return typeof value === 'number';
}