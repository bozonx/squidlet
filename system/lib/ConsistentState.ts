import {cloneDeepObject, isEmptyObject, mergeDeepObjects} from './objects';
import {concatUniqStrArrays} from './arrays';
import {Dictionary} from '../interfaces/Types';
import Queue, {JobId} from './Queue';
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
 * It update state immediately on writing request but if there is writing request in progress then
 * a new state will be temporary stored in a cache and if current request has been successful then
 * cached state will be set at current and a new write request will be started.
 */
export default class ConsistentState {
  protected initialize?: Initialize;
  protected readonly getter?: Getter;
  protected readonly setter?: Setter;

  private readonly logError: (msg: string) => void;
  // getter of local state
  private readonly stateGetter: () => Dictionary;
  // updater of local state
  private readonly stateUpdater: (partialState: Dictionary) => void;
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
    delete this.nextWritePartialState;
  }


  isWriting(): boolean {
    return this.queue.getCurrentJobId() === WRITING_ID;
  }

  isReading(): boolean {
    return this.queue.getCurrentJobId() === READING_ID;
  }

  isInProgress(): boolean {
    return this.queue.isInProgress();
  }

  getState(): Dictionary {
    return this.stateGetter();
  }

  /**
   * Call this method after you have received state handling device or driver events.
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
      // just return resolved promise
      return Promise.resolve();
    }
    else if (this.isWriting()) {
      // if current job is writing
      this.nextWritePartialState = mergeDeepObjects(partialData, this.nextWritePartialState);

      return this.makePostponedWritePromise();
    }
    else if (this.queue.getQueuedJobsId().includes(WRITING_ID)) {
      // if writing is in a queue but not started
      // save param names which should be written and update state
      if (!this.paramsListToSave) {
        return Promise.reject(`ConsistentState.write: paramsListToSave has to be set`);
      }
      // collect list of params which will be actually written
      this.paramsListToSave = concatUniqStrArrays(this.paramsListToSave, Object.keys(partialData));
      // update local state right now in any case
      this.stateUpdater(partialData);
      // return promise which will be resolved when write has done.
      return this.queue.waitJobFinished(WRITING_ID);
    }
    // else reading in progress or no current writing or in the queue - start a new job
    return this.startNewWriteJob(partialData);
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

    this.stateUpdater( this.generateSafeNewState(result) );
  }

  /**
   * Start a new job. At this moment writing hasn't being processed.
   * @param partialData
   */
  private startNewWriteJob(partialData: Dictionary): Promise<void> {
    if (this.nextWritePartialState) {
      return Promise.reject(`ConsistentState.write: nextWritePartialState has to be removed`);
    }
    else if (this.actualRemoteState) {
      return Promise.reject(`ConsistentState.write: actualRemoteState has to be removed`);
    }
    else if (this.paramsListToSave) {
      return Promise.reject(`ConsistentState.write: paramsListToSave has to be removed`);
    }
    // Save actual state. It needs to use it to do fallback on error.
    // actualRemoteState can be exist if data came while writing
    this.actualRemoteState = mergeDeepObjects(this.getState(), this.actualRemoteState);
    //this.actualRemoteState = cloneDeepObject(this.getState());
    // collect list of params which will be actually written
    this.paramsListToSave = Object.keys(partialData);
    // update local state right now in any case
    this.stateUpdater(partialData);
    // add job to queue
    this.queue.add(this.writeJobCb, WRITING_ID);
    this.queue.onJobEndOnce(WRITING_ID, this.handleWritingJobEnd);
    // return promise which will be resolved when write has done.
    return this.queue.waitJobFinished(WRITING_ID);
  }

  private writeJobCb = (): Promise<void> => {
    if (!this.setter) {
      return Promise.reject(`ConsistentState.handleWriteQueueStart: no setter`);
    }
    // generate the last combined data to save
    const dataToSave: Dictionary = this.collectDataToSave();
    // do nothing if data is empty. It means that some params was changed while cb idled in a queue.
    if (isEmptyObject(dataToSave)) return Promise.resolve();
    // write collected data
    return this.setter(dataToSave);
  }

  private handleWritingJobEnd = (error: string | undefined) => {
    if (error) {
      return this.handleWriteError();
    }

    this.handleWriteSuccess();
  }

  /**
   * When write is successful then it should device finish job or start one more writing
   * if there is next state to write.
   */
  private handleWriteSuccess() {
    // end of cycle
    delete this.actualRemoteState;
    delete this.paramsListToSave;

    // if no next state - then cycle has been finished
    if (!this.nextWritePartialState) return;

    // or start a new writing job
    const dataToSave: Dictionary = this.nextWritePartialState;

    delete this.nextWritePartialState;

    // start next writing
    this.startNewWriteJob(dataToSave)
      .catch(this.logError);
  }

  /**
   * Restore previously actual state on write error.
   */
  private handleWriteError() {
    this.stateUpdater(this.restorePreviousState());

    delete this.actualRemoteState;
    delete this.paramsListToSave;
    delete this.nextWritePartialState;
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

  private makePostponedWritePromise(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.onJobEndOnce(WRITING_ID, (error: string | undefined) => {
        if (error) return reject(new Error(error));

        this.queue.onJobEndOnce(WRITING_ID, (error: string | undefined) => {
          if (error) return reject(new Error(error));

          resolve();
        });
      });
    });
  }

}
