import ServiceBase from 'host/baseServices/ServiceBase';
import categories from 'host/dict/categories';
import topics from 'host/dict/topics';
import {ManifestsTypeName} from 'host/interfaces/ManifestTypes';


enum UPDATER_STATUS {
  ok,
  notWritten,
}

interface UpdateEntityData {
  type: ManifestsTypeName;
  name: string;
  package: Uint8Array;
  remove?: boolean;
}

interface UpdateEntityResult {
  type: ManifestsTypeName;
  name: string;
  status: UPDATER_STATUS;
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


  private listen() {
    this.env.events.addListener(categories.updater, topics.updater.versionsRequest, this.onAskVersions);
    this.env.events.addListener(categories.updater, topics.updater.updateConfigs, this.onUpdateConfigs);
    this.env.events.addListener(categories.updater, topics.updater.updateEntity, this.onUpdateEntity);
    this.env.events.addListener(categories.updater, topics.updater.updateHost, this.onUpdateHost);
    this.env.events.addListener(categories.updater, topics.updater.updateFile, this.onUpdateFile);
  }

  private onAskVersions = (data: UpdateEntityData) => {
    console.log('----- onAskVersions', data);

    // TODO: collect versions to json
    const versions = 'versions';

    this.env.events.emit(categories.updater, topics.updater.versionsResponse, versions);
  }

  private onUpdateConfigs = (data: Uint8Array) => {
    // TODO: unpack to tmp dir, and replace real configs dir
    console.log('----- onUpdateConfigs', data);

    const result: number = UPDATER_STATUS.ok;

    this.env.events.emit(categories.updater, topics.updater.updateConfigsResult, result);
  }

  private onUpdateEntity = (data: UpdateEntityData) => {
    // TODO: unpack to tmp dir, and replace real entity
    // TODO: remove if specified
    console.log('----- onUpdateEntity', data);

    const result: UpdateEntityResult = {
      type: data.type,
      name: data.name,
      status: UPDATER_STATUS.ok,
    };

    this.env.events.emit(categories.updater, topics.updater.updateEntityResult, result);
  }

  private onUpdateHost = (data: Uint8Array) => {
    // TODO: unpack to tmp dir, and replace real host
    console.log('----- onUpdateHost', data);

    const result: number = UPDATER_STATUS.ok;

    this.env.events.emit(categories.updater, topics.updater.updateHostResult, result);
  }

  private onUpdateFile = (data: UpdateFileData) => {
    // TODO: remove if specified
    console.log('----- onUpdateFile', data);

    const result: number = UPDATER_STATUS.ok;

    this.env.events.emit(categories.updater, topics.updater.updateFileResult, result);
  }

}
