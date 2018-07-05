import Message from './Message';


export default interface Response extends Message {
  // request or response unique id
  requestId: string;
  isResponse: true;
  payload?: any;
  // error message
  error?: string;
  // return/error code
  code?: number;
}
