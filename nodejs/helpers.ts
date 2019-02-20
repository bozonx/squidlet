export function convertBufferToUint8Array(data: Buffer): Uint8Array {
  const uIntArr = new Uint8Array(data.length);

  for(let i = 0; i < data.length; i++) {
    uIntArr[i] = data.readInt8(i);
  }

  return uIntArr;
}

export function callPromised(method: Function, ...params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    method(...params, (err: Error, data: any) => {
      if (err) return reject(err);

      resolve(data);
    });
  });
}
