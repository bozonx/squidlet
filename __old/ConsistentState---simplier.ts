import {concatUniqStrArrays, mergeDeep} from '../system/helpers/collections';
import {Dictionary} from '../system/interfaces/Types';
import RequestQueue, {Mode} from '../system/helpers/RequestQueue';
import {cloneDeep, pick} from '../system/helpers/lodashLike';


export type Initialize = () => Promise<Dictionary>;
export type Getter = () => Promise<Dictionary>;
export type Setter = (partialData: Dictionary) => Promise<void>;

const WRITING_ID = 'write';
const READING_ID = 'read';


/**
 * State which is consistent while reading and writing.
 */
export default class ConsistentState {
  private readonly logError: (msg: string) => void;
  // getter of local state
  private readonly stateGetter: () => Dictionary;
  // updater of local state
  private readonly stateUpdater: (partialState: Dictionary) => void;
  private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  private readonly setter?: Setter;
  private readonly queue: RequestQueue;
  // actual state on server before saving
  private actualRemoteState?: Dictionary;
  // list of parameters which are saving to server
  private paramsListToSave?: string[];


  constructor(
    logError: (msg: string) => void,
    stateGetter: () => Dictionary,
    stateUpdater: (partialState: Dictionary) => void,
    jobTimeoutSec?: number,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter
  ) {
    this.logError = logError;
    this.stateGetter = stateGetter;
    this.stateUpdater = stateUpdater;
    this.initialize = initialize;
    this.getter = getter;
    this.setter = setter;

    this.queue = new RequestQueue(this.logError, jobTimeoutSec);
  }

  async init() {
    if (!this.initialize && !this.getter) throw new Error(`There aren't any getter or initialize callbacks`);

    let getter = this.getter;

    if (this.initialize) getter = this.initialize;

    const result: Dictionary = await this.requestGetter(getter as Getter);

    this.stateUpdater(result);
  }

  // TODO: REMOVE
  private async requestGetter(getter: Getter): Promise<Dictionary> {
    let result: Dictionary | undefined = undefined;

    this.queue.request(READING_ID, async () => {
      result = await getter();
    });

    await this.queue.waitJobFinished(READING_ID);

    if (!result) throw new Error(`ConsistentState.requestGetter: no result`);

    return result;
  }

  // TODO: test
  destroy() {
    this.queue.destroy();
    delete this.actualRemoteState;
    delete this.paramsListToSave;
  }


  // TODO: test
  isWriting(): boolean {
    return this.queue.getCurrentJobId() === WRITING_ID;
  }

  // TODO: test
  isReading(): boolean {
    return this.queue.getCurrentJobId() === READING_ID;
  }

  // TODO: test
  getState(): Dictionary {
    return this.stateGetter();
  }

  // TODO: test
  // TODO: review
  setIncomeState(partialState: Dictionary) {
    if (this.isReading()) {
      // do nothing if force reading is in progress. It will return the truly state
      return;
    }
    else if (this.isWriting()) {
      this.stateUpdater(partialState);

      this.tmpStateBeforeWriting = mergeDeep(partialState, this.tmpStateBeforeWriting);

      return;
    }

    // there aren't reading and writing - just update
    this.stateUpdater(partialState);
  }

  /**
   * Read whole state manually.
   * It useful when for example you want to make state actual after connection lost.
   * But usually it doesn't need because it's better to pass income state which you received by listening
   * to income data events to setIncomeState() method.
   * The logic of this method:
   * * If getter is set it will be called
   * * If there isn't any getter - it will do nothing
   * * If reading is in progress it will return promise of current reading process
   */
  async load(): Promise<void> {

    // TODO: test

    if (!this.getter) return;

    this.queue.request(READING_ID, this.handleLoading);

    await this.queue.waitJobFinished(READING_ID);
  }

  /**
   * Update local state and pass it to setter.
   * Call it when you want to set a new state e.g when some button changed its state.
   * The logic:
   * * If writing is in progress then a new writing will be queued.
   * * If reading is in progress it will be add to queue.
   * * On error it will return state which was before saving started.
   */
  async write(partialData: Dictionary): Promise<void> {
    // if mode without setter - do noting else updating local state
    if (!this.setter) return this.stateUpdater(partialData);

    this.paramsListToSave = concatUniqStrArrays(this.paramsListToSave || [], Object.keys(partialData));

    // add to queue
    this.queue.request(WRITING_ID, this.handleSaving, 'recall');

    await this.queue.waitJobStart(WRITING_ID);

    // Save actual state. It has to be called only once on starting of cycle
    if (!this.actualRemoteState) {
      this.actualRemoteState = cloneDeep(this.getState());
    }
    
    // TODO: если сделали много write пока идет reading - то после ожидания начала выполенения сразу много
    //       выполнится stateUpdater за раз
    // update local state at the beginning of process
    this.stateUpdater(partialData);

    if (this.queue.isJobInProgress(WRITING_ID)) {
      // wait current saving
      await this.queue.waitJobFinished(WRITING_ID);
      // wait the next recall. And don't wait if the current is fail
      await this.queue.waitJobFinished(WRITING_ID);
    }
    else {
      // wait current saving
      await this.queue.waitJobFinished(WRITING_ID);
    }
  }


  private handleLoading = async () => {
    if (!this.getter) throw new Error(`No getter`);

    const result: Dictionary = await this.getter();

    this.stateUpdater(result);
  }

  private handleSaving = async () => {
    if (!this.setter) {
      throw new Error(`ConsistentState.write: no setter`);
    }
    else if (!this.paramsListToSave) {
      throw new Error(`ConsistentState.write: no paramsListToSave`);
    }

    // generate the last combined data to save
    const dataToSave = pick(this.getState(), ...this.paramsListToSave);

    try {
      await this.setter(dataToSave);
    }
    catch (err) {
      if (!this.actualRemoteState) {
        throw new Error(`ConsistentState.write: no actualRemoteState`);
      }

      this.stateUpdater(this.actualRemoteState);

      delete this.actualRemoteState;
      delete this.paramsListToSave;

      throw err;
    }

    if (this.queue.jobHasRecallCb(WRITING_ID)) {
      // there is a next recall cb
      this.actualRemoteState = {
        ...this.actualRemoteState,
        ...dataToSave,
      };

      // TODO: удалить из paramsListToSave сохраненные параметры
      //  - но мы достоверно не знаем может были запросы на пересохранение тех же параметров
      //  надо удалить те параметры значения которых не отличаются
      //  между this.actualRemoteState и dataToSave.
      //  Иначе будут сохраняться все параметры на наждый recall
    }
    else {
      // end of cycle
      delete this.actualRemoteState;
      delete this.paramsListToSave;
    }
  }

}
