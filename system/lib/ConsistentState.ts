import {cloneDeepObject, mergeDeepObjects} from './objects';
import {concatUniqStrArrays} from './arrays';
import {Dictionary} from '../interfaces/Types';
import Queue from './Queue';
import QueueOverride from './QueueOverride';
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
  private readonly writeOverride: QueueOverride;
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

    this.queue = new Queue(jobTimeoutSec);
    this.writeOverride = new QueueOverride(jobTimeoutSec);
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
    delete this.paramsListToSave;
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
    // if mode without setter - do noting else updating local state
    if (!this.setter) {
      this.stateUpdater(partialData);

      return Promise.resolve();
    }

    // Save actual state. It has to be called only once on starting of cycle
    if (!this.actualRemoteState) {
      this.actualRemoteState = cloneDeepObject(this.getState());
    }

    // collect list of params which will be actually written
    this.paramsListToSave = concatUniqStrArrays(this.paramsListToSave || [], Object.keys(partialData));

    return this.doWriteRequest(partialData);
  }


  private doWriteRequest(partialData: Dictionary): Promise<void> {
    // update local state on each call of write
    this.stateUpdater(partialData);

    // do writing request any way if it is a new request or there is writing is in progress
    // add queue cb at the first time
    if (this.queue.hasJob(WRITING_ID)) {
      // TODO: обновлять промис queue override

    }
    else {
      this.queue.add(this.handleWriteQueueStart, WRITING_ID);

    }

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

  private handleWriteQueueStart = async () => {
    // TODO: нужно ли сохранять промис?
    const overridePromise: Promise<void> = this.writeOverride.add(this.handleWrite);

    // TODO: test момент что закончился предыдущий cb и начался следующий

    if (!this.writeOverride.isPending()) return Promise.resolve();

    // TODO: берем промис override ожидаем пока закончится, если не закончился - то ещё раз берем
  }

  private handleWrite = async () => {
    if (!this.setter) {
      throw new Error(`ConsistentState.handleWrite: no setter`);
    }
    else if (!this.paramsListToSave) {
      throw new Error(`ConsistentState.handleWrite: no paramsListToSave`);
    }
    // generate the last combined data to save
    const dataToSave: Dictionary = pickObj(this.getState(), ...this.paramsListToSave);
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
  }

  /**
   * Make undefined that keys which weren't before string writing
   */
  private restorePreviousState(): Dictionary {
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
