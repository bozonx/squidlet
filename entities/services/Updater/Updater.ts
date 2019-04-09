import ServiceBase from 'host/baseServices/ServiceBase';
import categories from 'host/dict/categories';
import topics from 'host/dict/topics';
import {ManifestsTypeName} from 'host/interfaces/ManifestTypes';


interface UpdateEntityData {
  type: ManifestsTypeName;
  name: string;
  package: Uint8Array;
  remove?: boolean;
}

interface UpdateFileData {
  fileName: string;
  file: Uint8Array;
  remove?: boolean;
}

interface Props {
}

export default class Updater extends ServiceBase<Props> {
  protected didInit = async () => {
    this.listen();
  }

  protected destroy = () => {
    // TODO: remove listener
  }


  private listen() {
    // TODO: add ask versions
    this.env.events.addListener(categories.updater, topics.updater.updateEntity, this.onUpdateEntity);
    this.env.events.addListener(categories.updater, topics.updater.updateHost, this.onUpdateHost);
    this.env.events.addListener(categories.updater, topics.updater.updateFile, this.onUpdateFile);
  }

  private onUpdateEntity = (data: UpdateEntityData) => {
    console.log('----- onUpdateEntity', data);
  }

  private onUpdateHost = (data: Uint8Array) => {
    console.log('----- onUpdateHost', data);
  }

  private onUpdateFile = (data: UpdateFileData) => {
    console.log('----- onUpdateFile', data);
  }

}
