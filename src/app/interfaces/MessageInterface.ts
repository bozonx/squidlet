import AddressInterface from './AddressInterface';


export default interface Message {
  topic: string;
  category: string;
  from: AddressInterface;
  to: AddressInterface;
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
