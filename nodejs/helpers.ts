import _difference = require('lodash/difference');


export function convertBufferToUint8Array(data: Buffer): Uint8Array {
  const uIntArr = new Uint8Array(data.length);

  for(let i = 0; i < data.length; i++) {
    uIntArr[i] = data.readInt8(i);
  }

  return uIntArr;
}

export function checkDevs(machineDevs: string[], hostDevs: string[]) {
  const diff: string[] = _difference(machineDevs, hostDevs);

  if (diff.length) {
    throw new Error(`There aren't some devs "${JSON.stringify(diff)}" in the selected platform`);
  }
}
