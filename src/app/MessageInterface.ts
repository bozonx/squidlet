export default interface Message {
  topic: string;
  category: string;
  payload: Array<any>;
  from: string;
  to: string;
  request?: {
    id: string,
    isRequest?: boolean,
    isResponse?: boolean,
  };
  error?: {
    message: string,
    code: number,
  };
}
