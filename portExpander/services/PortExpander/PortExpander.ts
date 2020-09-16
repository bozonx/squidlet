import ServiceBase from 'system/base/ServiceBase';
import IoItem from 'system/interfaces/IoItem';
import {IoSetBase} from 'system/interfaces/IoSet';
import Connection from 'system/interfaces/Connection';
import Digital from './io/Digital';


interface Props {
  // name of connection service to use
  connection: string;
}


const ios: {[index: string]: new (connection: Connection) => void} = {
  Digital,
};


export default class PortExpander extends ServiceBase<Props> implements IoSetBase {
  private connection!: Connection;
  private readonly usedIo: {[index: string]: any} = {};

  init = async () => {
    if (!this.context.service[this.props.connection]) {
      throw new Error(`Connection "${this.props.connection}" hasn't been setup`);
    }

    this.connection = this.context.service[this.props.connection];
  }

  destroy = async () => {
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (!this.usedIo[ioName]) {
      this.usedIo[ioName] = new ios[ioName](this.connection);
    }

    return this.usedIo[ioName];
  }

  getNames(): string[] {
    return Object.keys(ios);
  }

}
