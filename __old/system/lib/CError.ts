export class CError extends Error {
  readonly code: number;
  readonly message: string;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.message = message;
    // @ts-ignore
    this.__proto__.toString = (): string => `Code ${this.code}. ${this.message}`;
  }
}
