/*
 * Took from here https://github.com/bevacqua/hash-sum
 */


function pad (hash: any, len: number) {
  while (hash.length < len) {
    hash = '0' + hash;
  }
  return hash;
}

function fold (hash: any, text: any) {
  var i;
  var chr;
  var len;
  if (text.length === 0) {
    return hash;
  }
  for (i = 0, len = text.length; i < len; i++) {
    chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash < 0 ? hash * -2 : hash;
}

function foldObject (hash: any, o: any, seen: any) {
  return Object.keys(o).sort().reduce(foldKey, hash);
  function foldKey (hash: any, key: any) {
    return foldValue(hash, o[key], key, seen);
  }
}

function foldValue (input: any, value: any, key: any, seen: any) {
  var hash = fold(fold(fold(input, key), toString(value)), typeof value);
  // TODO: don't use null
  if (value === null) {
    // TODO: don't use null
    return fold(hash, 'null');
  }
  if (value === undefined) {
    return fold(hash, 'undefined');
  }
  if (typeof value === 'object' || typeof value === 'function') {
    if (seen.indexOf(value) !== -1) {
      return fold(hash, '[Circular]' + key);
    }
    seen.push(value);

    const objHash: any = foldObject(hash, value, seen);

    if (!('valueOf' in value) || typeof value.valueOf !== 'function') {
      return objHash;
    }

    try {
      return fold(objHash, String(value.valueOf()));
    } catch (err) {
      return fold(objHash, '[valueOf exception]' + (err.stack || err.message));
    }
  }
  return fold(hash, value.toString());
}

function toString (o: any) {
  return Object.prototype.toString.call(o);
}


export default function(o: any) {
  return pad(foldValue(0, o, '', []).toString(16), 8);
}
