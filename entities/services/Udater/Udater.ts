import ServiceBase from 'host/baseServices/ServiceBase';
import LogLevel from 'host/interfaces/LogLevel';
import categories from 'host/dict/categories';
import topics from 'host/dict/topics';


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
    this.env.events.addListener(categories.updater, topics.updater.updateEntity, this.onUpdateEntity);
    this.env.events.addListener(categories.updater, topics.updater.updateHost, this.onUpdateHost);
    this.env.events.addListener(categories.updater, topics.updater.updateFile, this.onUpdateFile);
    this.env.events.addListener(categories.updater, topics.updater.removeFile, this.onRemove);

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

  private onUpdateEntity = (data: null) => {
  }

  private onUpdateHost = (data: null) => {
  }

  private onUpdateFile = (data: null) => {
  }

  private onRemove = (data: null) => {
  }

}
