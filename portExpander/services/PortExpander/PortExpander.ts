import ServiceBase from 'system/base/ServiceBase';
import IoItem from 'system/interfaces/IoItem';
import {IoSetBase} from 'system/interfaces/IoSet';
import Connection from 'system/interfaces/Connection';


interface Props {
  // name of connection service to use
  connection: string;
}


export default class PortExpander extends ServiceBase<Props> implements IoSetBase {
  private connection!: Connection;

  init = async () => {
    if (!this.context.service[this.props.connection]) {
      throw new Error(`Connection "${this.props.connection}" hasn't been setup`);
    }

    this.connection = this.context.service[this.props.connection];
  }

  destroy = async () => {
  }


  getIo<T extends IoItem>(ioName: string): T {

  }

  getNames(): string[] {

  }

}
