export function convertBufferToUint8Array(data: Buffer): Uint8Array {
  const uIntArr = new Uint8Array(data.length);

  for(let i = 0; i < data.length; i++) {
    uIntArr[i] = data.readInt8(i);
  }

  return uIntArr;
}
