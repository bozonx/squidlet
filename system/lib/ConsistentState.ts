import {cloneDeepObject, isEmptyObject, mergeDeepObjects} from './objects';
import {concatUniqStrArrays} from './arrays';
import {Dictionary} from '../interfaces/Types';
import Queue from './Queue';
import {pickObj} from './objects';
import {arraysDifference} from './arrays';


export type Initialize = () => Promise<Dictionary>;
export type Getter = () => Promise<Dictionary>;
export type Setter = (partialData: Dictionary) => Promise<void>;

const WRITING_ID = 'write';
const READING_ID = 'read';


/**
 * State which is consistent while reading and writing.
 * WARNING!: don't use nested state - it will work badly on save and reading when it combines a state to change
 */
export default class ConsistentState {
  private readonly logError: (msg: string) => void;
  // getter of local state
  private readonly stateGetter: () => Dictionary;
  // updater of local state
  private readonly stateUpdater: (partialState: Dictionary) => void;
  protected initialize?: Initialize;
  protected readonly getter?: Getter;
  protected readonly setter?: Setter;

  private readonly queue: Queue;
  //private readonly writeOverride: QueueOverride;
  // actual state on server before saving
  private actualRemoteState?: Dictionary;
  // list of parameters which are saving to server
  private paramsListToSave?: string[];
  // if there is current write then the partial state of the next writing is collecting to write
  // after current writing
  private nextWritePartialState?: Dictionary;


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

    this.queue = new Queue(jobTimeoutSec);
    //this.writeOverride = new QueueOverride(jobTimeoutSec);
  }

  init(): Promise<void> {
    let getter: Getter;

    if (this.initialize) {
      getter = this.initialize;
    }
    else if (this.getter) {
      getter = this.getter;
    }
    else {
      throw new Error(`There aren't any getter or initialize callbacks`);
    }

    return this.doInitialize(getter);
  }

  destroy() {
    this.queue.destroy();
    delete this.actualRemoteState;
    delete this.nextWritePartialState;
    //delete this.paramsListToSave;
  }


  isWriting(): boolean {
    return this.queue.getCurrentJobId() === WRITING_ID;
  }

  isReading(): boolean {
    return this.queue.getCurrentJobId() === READING_ID;
  }

  // TODO: test
  isInProgress(): boolean {
    return this.queue.isInProgress();
  }

  getState(): Dictionary {
    return this.stateGetter();
  }

  /**
   * Call this method after you have received state handling device or driver events.
   *
   */
  setIncomeState(partialState: Dictionary) {
    if (this.isReading()) {
      // do nothing if reading is in progress. It will return the full actual state
      return;
    }
    else if (this.isWriting()) {
      // make new state but don't update params which are saving at the moment because
      // these params are the most actual
      const newState = this.generateSafeNewState(partialState);

      this.stateUpdater(newState);
      this.actualRemoteState = mergeDeepObjects(partialState, this.actualRemoteState);

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
   * * If getter is set - it will be proceeded
   * * If there isn't any getter - it will do nothing
   * * If reading is in progress it will return promise of current reading process
   */
  load(): Promise<void> {
    if (!this.getter) return Promise.resolve();

    this.queue.add(this.handleLoading, READING_ID);

    return this.queue.waitJobFinished(READING_ID);
  }

  /**
   * Update local state and pass it to setter.
   * Call it when you want to set a new state e.g when some button changed its state.
   * The logic:
   * * If writing is in progress then a new writing will be queued.
   * * If reading is in progress it will wait for its completion.
   * * On error it will return state which was before saving started.
   */
  write(partialData: Dictionary): Promise<void> {
    if (!this.setter) {
      // if mode without setter - do noting else updating local state
      this.stateUpdater(partialData);

      return Promise.resolve();
    }
    else if (this.queue.getCurrentJobId() === WRITING_ID) {
      // TODO: нужно сразу установить стейт
      // TODO: сохранять только имена ключей
      // TODO: ?????? strong review - нужно сразу установить стейт, а потом решить какой стейт записывать
      //                              и что возвращать когда будет ошибка
      // if current job is writing
      this.nextWritePartialState = mergeDeepObjects(partialData, this.nextWritePartialState);
    }
    else if (this.queue.hasJob(WRITING_ID)) {
      // if writing is in a queue but not started
      // save param names which should be written and update state
      if (!this.paramsListToSave) {
        return Promise.reject(`ConsistentState.write: paramsListToSave has to be set`);
      }
      // collect list of params which will be actually written
      this.paramsListToSave = concatUniqStrArrays(this.paramsListToSave, Object.keys(partialData));
    }
    else {
      try {
        this.startNewWriteJob(partialData);
      }
      catch (e) {
        return Promise.reject(e);
      }
    }

    // update local state right now in any case
    this.stateUpdater(partialData);
    // return promise which will be resolved when write has done.
    return this.queue.waitJobFinished(WRITING_ID);
  }


  /**
   * Ask for latest state at init time.
   */
  private async doInitialize(getter: Getter): Promise<void> {
    let result: Dictionary | undefined = undefined;

    this.queue.add(async () => {
      result = await getter();
    }, READING_ID);

    await this.queue.waitJobFinished(READING_ID);

    if (!result) throw new Error(`ConsistentState.doInitialize: no result`);

    this.stateUpdater(result);
  }

  private handleLoading = async () => {
    if (!this.getter) throw new Error(`No getter`);

    const result: Dictionary = await this.getter();

    // just update state in ordinary mode
    if (!this.actualRemoteState) {
      this.stateUpdater(result);

      return;
    }

    // if saving has being in progress when the reading started - it needs to update actual server state
    // and carefully update the state.
    this.actualRemoteState = result;

    const newState = this.generateSafeNewState(result);

    this.stateUpdater(newState);
  }

  private startNewWriteJob(partialData: Dictionary) {
    // no writing in a queue
    if (this.nextWritePartialState) {
      throw new Error(`ConsistentState.write: nextWritePartialState has to be removed`);
    }
    else if (this.actualRemoteState) {
      throw new Error(`ConsistentState.write: actualRemoteState has to be removed`);
    }
    else if (this.paramsListToSave) {
      throw new Error(`ConsistentState.write: paramsListToSave has to be removed`);
    }
    // Save actual state. It needs to use it to do fallback on error
    this.actualRemoteState = cloneDeepObject(this.getState());
    // collect list of params which will be actually written
    this.paramsListToSave = Object.keys(partialData);
    // add job to queue
    this.queue.add(this.handleWriteQueueStart, WRITING_ID);
  }

  private handleWriteQueueStart = async () => {
    if (!this.setter) {
      throw new Error(`ConsistentState.handleWriteQueueStart: no setter`);
    }
    // generate the last combined data to save
    const dataToSave: Dictionary = this.collectDataToSave();
    // do nothing if data is empty. It means that some params was changed while cb idled in a queue.
    if (isEmptyObject(dataToSave)) return;
    // write collected data
    try {
      await this.setter(dataToSave);
    }
    catch (err) {
      this.handleWriteError();

      throw err;
    }

    this.finalizeWriting(dataToSave);
  }

  private finalizeWriting(dataToSave: Dictionary) {

    // TODO: test момент что закончился предыдущий cb и начался следующий

    // TODO: берем промис override ожидаем пока закончится, если не закончился - то ещё раз берем
    // TODO: review
    if (!this.queue.jobHasRecallCb(WRITING_ID)) {
      // end of cycle
      delete this.actualRemoteState;
      delete this.paramsListToSave;

      return;
    }

    // If there is the next recall cb - then update actualRemoteState and paramsListToSave.
    // Update actualRemoteState
    this.actualRemoteState = {
      ...this.actualRemoteState,
      ...dataToSave,
    };
    // TODO: test
    // remove saved keys from the list
    this.paramsListToSave = arraysDifference(this.paramsListToSave || [], Object.keys(dataToSave));
  }

  /**
   * Restore previously actual state on write error.
   */
  private handleWriteError() {
    this.stateUpdater(this.restorePreviousState());

    // TODO: test что очереди удалились на этот момент

    delete this.actualRemoteState;
    delete this.paramsListToSave;
    delete this.nextWritePartialState;
  }

  /**
   * Make undefined that keys which weren't before string writing
   */
  private restorePreviousState(): Dictionary {
    // TODO: review
    if (!this.actualRemoteState) {
      throw new Error(`ConsistentState.restorePreviousState: no actualRemoteState`);
    }
    else if (!this.paramsListToSave) {
      throw new Error(`ConsistentState.restorePreviousState: no paramsListToSave`);
    }

    const newParams: Dictionary = {};

    // TODO: test что undefined точно заменить лишние параметры
    for (let paramName of arraysDifference(this.paramsListToSave, Object.keys(this.actualRemoteState))) {
      newParams[paramName] = undefined;
    }

    return {
      ...this.actualRemoteState,
      ...newParams
    };
  }

  /**
   * Collect data to send to server
   */
  private collectDataToSave(): Dictionary {
    if (!this.actualRemoteState) {
      throw new Error(`ConsistentState.collectDataToSave: no actualRemoteState`);
    }
    else if (!this.paramsListToSave) {
      throw new Error(`ConsistentState.collectDataToSave: no paramsListToSave`);
    }

    const result: Dictionary = {};
    const currentState: Dictionary = this.getState();

    for (let key of this.paramsListToSave) {
      // save only values which actually has been changed
      if (currentState[key] !== this.actualRemoteState[key]) {
        result[key] = currentState[key];
      }
    }

    return result;
  }

  /**
   * Generate a new state object with a new actual params
   * but don't update params which are saving at the moment.
   */
  private generateSafeNewState(mostActualState: Dictionary): Dictionary {
    // TODO: test
    // get key witch won't be saved
    const keysToUpdate: string[] = arraysDifference(
      Object.keys(mostActualState),
      this.paramsListToSave || []
    );

    return {
      ...this.getState(),
      ...pickObj(mostActualState, ...keysToUpdate),
    };
  }

}
