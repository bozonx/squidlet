import ServiceBase from 'host/baseServices/ServiceBase';
import LogLevel from 'host/interfaces/LogLevel';
import categories from 'host/dict/categories';


interface Props {
}

export default class Udater extends ServiceBase<Props> {
  protected didInit = async () => {
    this.listen();
  }

  protected destroy = () => {
    // TODO: remove listener
  }


  private listen() {
    this.env.events.addListener(categories.updater, level, this.logEventsHandler);

    // const hosts: string[] = ['master'];
    //
    // for (let hostId of hosts) {
    //
    //   // listen to allowed levels
    //   for (let level of allowedLogLevels) {
    //     this.env.events.addListener(categories.logger, level, this.logEventsHandler);
    //   }
    // }
  }

  private logEventsHandler = (data: {level: LogLevel, message: string}) => {
    defaultLogger[data.level](data.message);
  }

}
