import Destination from './Destination';


export default interface Message {
  topic: string;
  category: string;
  from: Destination;
  to: Destination;
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
