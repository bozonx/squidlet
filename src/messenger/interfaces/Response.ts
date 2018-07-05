import Message from './Message';


export default interface Response extends Message {
  // request or response unique id
  requestId: string;
  payload?: any;
  errorMsg?: string;
  errorNo?: number;
}
