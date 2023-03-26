import Timeout = NodeJS.Timeout;
import {ChangeHandler} from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalInputIo.js';
import DebounceCall from '../../../../../squidlet-lib/src/debounceCall/DebounceCall';
import IndexedEventEmitter from '../../../../../squidlet-lib/src/IndexedEventEmitter';
import {Edge, InputResistorMode} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/gpioTypes.js';
import {isDigitalPinInverted, resolveEdge} from '../../../../../squidlet-lib/src/digitalHelpers';


// interface InputPinProps {
//   debounce?: number;
//   edge: Edge;
// }

const READ_RESULT_PREFIX = 'result';


export default class DigitalExpanderInputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly pollOnce: () => Promise<void>;
  private readonly waitResultTimeoutSec: number;
  // change events of input pins
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  private readonly debounce = new DebounceCall();
  //private readonly polling?: Polling;
  private state: {[index: string]: boolean} = {};
  // TODO: зачем их тут хранить??? может брать у драйвера ???
  //private pinProps: {[index: string]: InputPinProps} = {};
  // timeouts for the time when pin is waiting for poll result after debounce
  private waitingNewStateTimeouts: {[index: string]: Timeout} = {};


  constructor(
    logError: (msg: Error | string) => void,
    pollOnce: () => Promise<void>,
    waitResultTimeoutSec: number,
  ) {
    this.logError = logError;
    this.pollOnce = pollOnce;
    this.waitResultTimeoutSec = waitResultTimeoutSec;
  }

  destroy() {
    this.events.destroy();
    this.debounce.destroy();

    for (let pin of Object.keys(this.waitingNewStateTimeouts)) {
      clearTimeout(this.waitingNewStateTimeouts[pin]);
    }

    delete this.waitingNewStateTimeouts;
    delete this.state;
    delete this.pinProps;
  }


  /**
   * To use debounce at microcontroller side set debounce to 0.
   * At time this method called setup data has been sent to remote host.
   * @param pin
   * @param resistor
   * @param debounce
   * @param edge
   */
  setupPin(
    pin: number,
    resistor: InputResistorMode,
    debounce?: number,
    edge?: Edge
  ) {
    // convert edge if need to correctly resolve pin level change.
    // but pin level itself won't be converted
    const isInverted: boolean = isDigitalPinInverted(
      false,
      undefined,
      resistor === InputResistorMode.pulldown
    );
    const resolvedEdge: Edge = resolveEdge(this.pinProps[pin].edge, isInverted);

    this.pinProps[pin] = {
      debounce,
      edge: resolvedEdge,
    };
  }

  getState(): {[index: string]: boolean} {
    return this.state;
  }

  /**
   * Do poll and read a current state
   */
  async read(pin: number): Promise<boolean> {
    await this.readPinState(pin);

    return this.getState()[pin];
  }

  /**
   * Listen to changes of pin after debounce was processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    return this.events.addListener(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }

  /**
   * Do not handle pin any more
   */
  clearPin(pin: number) {
    clearTimeout(this.waitingNewStateTimeouts[pin]);
    // emit event to stop waiting for pin result
    this.events.emit(`${READ_RESULT_PREFIX}${pin}`);

    delete this.waitingNewStateTimeouts[pin];
    delete this.pinProps[pin];
    delete this.state[pin];

    this.events.removeAllListeners(pin);
    this.debounce.clear(pin);
  }

  /**
   * Handle poling income data of input pins.
   * There are can be changed and not changed input pins.
   */
  handleIncomeState = (newState: {[index: string]: boolean} | undefined) => {
    // means no new state
    if (!newState) return;
    // handle logic of all the changed pins
    for (let pinStr of Object.keys(newState)) {
      const pin: number = parseInt(pinStr);
      // if pin is in debounce time then do nothing. State doesn't matter.
      if (this.debounce.isInvoking(pin)) {
        continue;
      }
      // if pin is waiting final state after debounce
      else if (this.waitingNewStateTimeouts[pin]) {
        this.events.emit(`${READ_RESULT_PREFIX}${pin}`, newState[pin]);
      }
      // Else a fresh request.
      // Don't handle not changed pins.
      // It means they not changed but was delivered on poll.
      if (newState[pin] === this.state[pin]) continue;

      this.startDebounce(pin, newState[pin]);
    }
  }


  /**
   * Start a new debounce for pin which has been changed and isn't in debounce progress.
   */
  private startDebounce(pin: number, newValue: boolean) {
    if (!this.pinProps[pin]) {
      this.logError(`Pin "${pin}" hasn't been set up.`);

      return;
    }

    const debounceMs: number = this.pinProps[pin].debounce || 0;
    // make debounced call if it was set
    if (debounceMs > 0) {
      // wait for debounce and after than read current level
      // debounce don't handle cb's promise
      this.debounce.invoke(() => {
        this.readPinState(pin)
          .catch(this.logError);
      }, debounceMs, pin)
        .catch(this.logError);

      return;
    }
    // else emit right now if there isn't any debounce
    this.setFinalState(pin, newValue);
  }

  /**
   * While debounce is in progress all other requests are ignored.
   * When debounce is finished then the confirmation is started.
   * Debounce's callbacks doesn't wait for result.
   */
  private async readPinState(pin: number) {

    // TODO: review

    // do new poll
    this.pollOnce()
      .catch(this.logError);
    // start waiting for confirmation
    const finalState: boolean = await this.waitForPinNewState(pin);
    // on success set state and rise an event
    this.setFinalState(pin, finalState);
  }

  private waitForPinNewState(pin: number): Promise<boolean> {

    // TODO: review

    // it will be called immediately at the current tick.
    return new Promise<boolean>((resolve, reject) => {
      const handlerIndex = this.events.once(
        `${READ_RESULT_PREFIX}${pin}`,
        (level?: boolean) => {
          clearTimeout(this.waitingNewStateTimeouts[pin]);

          delete this.waitingNewStateTimeouts[pin];

          if (!this.pinProps[pin]) {
            throw new Error(`Can't handle new pin state because it has been cleared`);
          }
          if (typeof level !== 'boolean') {
            throw new Error(`Bad pin state level`);
          }

          resolve(level);
        }
      );

      this.waitingNewStateTimeouts[pin] = setTimeout(() => {
        this.events.removeListener(handlerIndex);

        delete this.waitingNewStateTimeouts[pin];

        reject(new Error(`Wait pin "${pin}" result timeout`));
      }, this.waitResultTimeoutSec * 1000);
    });
  }

  private setFinalState(pin: number, finalState: boolean) {
    // don't do anything if pin has been cleared
    if (!this.pinProps[pin]) return;

    // don't handle edge which is not suitable to edge that has been set up
    if (this.pinProps[pin].edge === Edge.rising && !finalState) {
      return;
    }
    else if (this.pinProps[pin].edge === Edge.falling && finalState) {
      return;
    }
    // set a new value
    this.state[pin] = finalState;
    // rise a event with the final state
    this.events.emit(pin, finalState);
  }

}
