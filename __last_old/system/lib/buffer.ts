// use it with nodejs

export function convertBufferToUint8Array(data: Buffer): Uint8Array {
  if (typeof Buffer === 'undefined') {
    throw new Error(`convertBufferToUint8Array: Your system doesn't support a Buffer`);
  }

  const uIntArr = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i++) {
    uIntArr[i] = data.readInt8(i);
  }

  return uIntArr;
}
