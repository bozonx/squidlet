import Message from './Message';


export default interface Response extends Message {
  payload?: any;
  // request or response unique id
  requestId: string;
  isResponse: true;
  // error message
  error?: string;
  // return/error code
  code?: number;
}
