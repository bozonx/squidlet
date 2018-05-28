export default interface Message {
  topic: string;
  category: string;
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
  payload: any;
}
