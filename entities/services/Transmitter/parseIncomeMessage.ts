
export enum RESULT_POSITIONS {
  functionNum,
  functionsArgs,
}

function parseDigitalOutput(data: Uint8Array): [number, any[]] {
  // TODO: add
}


export default function parseIncomeMessage(
  messages: Uint8Array[]
): [number, any[]][] {
  const result: [number, any[]][] = [];

  for (let item of messages) {
    // TODO: add
  }

  return result;
}
