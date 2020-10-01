import Timeout = NodeJS.Timeout;
import {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import DebounceCall from '../../lib/debounceCall/DebounceCall';
import IndexedEventEmitter from '../../lib/IndexedEventEmitter';
import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import {isDigitalPinInverted, resolveEdge} from '../../lib/digitalHelpers';
import Polling from '../../lib/Polling';


interface InputPinProps {
  debounce?: number;
  edge: Edge;
}

const READ_RESULT_PREFIX = 'result';


export default class DigitalExpanderInputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly pollOnce: () => Promise<void>;
  private readonly waitResultTimeoutSec: number;
  private readonly pollIntervalMs: number;
  // change events of input pins
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  private readonly debounce = new DebounceCall();
  private readonly polling?: Polling;
  private state: {[index: string]: boolean} = {};
  private pinProps: {[index: string]: InputPinProps} = {};
  private pollPromise?: Promise<void>;
  // timeouts for the time when pin is waiting for poll result after debounce
  private waitingFinalStateTimeouts: {[index: string]: Timeout} = {};


  constructor(
    logError: (msg: Error | string) => void,
    pollOnce: () => Promise<void>,
    waitResultTimeoutSec: number,
    pollIntervalMs: number,
    usePolling: boolean
  ) {
    this.logError = logError;
    this.pollOnce = pollOnce;
    this.waitResultTimeoutSec = waitResultTimeoutSec;
    this.pollIntervalMs = pollIntervalMs;

    if (usePolling) {
      this.polling = new Polling();
    }
  }

  destroy() {
    this.events.destroy();
    this.debounce.destroy();

    if (this.polling) this.polling.destroy();

    for (let pin of Object.keys(this.waitingFinalStateTimeouts)) {
      clearTimeout(this.waitingFinalStateTimeouts[pin]);
    }

    delete this.waitingFinalStateTimeouts;
    delete this.pollPromise;
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

    if (this.polling && !this.polling.isInProgress()) {
      // TODO: правильно ли использовать doPoll ???
      this.polling.start(this.doPoll, this.pollIntervalMs);
    }
  }

  getState(): {[index: string]: boolean} {
    return this.state;
  }

  /**
   * Do poll and read a current state
   */
  async read(pin: number): Promise<boolean> {
    // TODO: сделать poll restart и слушать ближайший ответ + таймаут

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
    clearTimeout(this.waitingFinalStateTimeouts[pin]);

    delete this.waitingFinalStateTimeouts[pin];
    delete this.pinProps[pin];
    delete this.state[pin];

    this.events.removeAllListeners(pin);
    this.debounce.clear(pin);
  }

  /**
   * Handle driver's income message
   * State which is income after poling request.
   * More than one pin can be changed.
   */
  handleIncomeState = (newState: {[index: string]: boolean}) => {
    // handle logic of all the changed pins
    for (let pinStr of Object.keys(newState)) {
      const pin: number = parseInt(pinStr);
      // if pin is in debounce time then do nothing. State doesn't matter.
      if (this.debounce.isInvoking(pin)) {
        continue;
      }
      // if pin is waiting final state after debounce
      else if (this.waitingFinalStateTimeouts[pin]) {
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
      this.debounce.invoke(() => this.handleEndOfDebounce(pin), debounceMs, pin)
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
  private handleEndOfDebounce(pin: number) {
    // start waiting for confirmation
    this.waitForConfirmation(pin)
      // on success set state and rise an event
      .then((finalState: boolean) => this.setFinalState(pin, finalState))
      .catch(this.logError);
    // do new poll
    if (this.polling) {
      // if polling is used then just restart it and don't wait for result
      this.polling.restart()
        .catch(this.logError);
    }
    else {
      // if polling isn't used then just do new poll
      this.doPoll()
        .catch(this.logError);
    }
  }

  private async doPoll() {
    // TODO: на ошибку очистить ожидание - удалить событие и таймаут

    // TODO: review может спокойно запускать новый poll - может там очередь отрабатывает
    //       так даже дожидаься не обязательно

    // If poll is in progress then just wait for poll is finished
    if (this.pollPromise) {
      // TODO: так как мы не ждем окончания, то при ошибке будет их много дублироваться
      await this.pollPromise;
    }
    // It there isn't any poll then make a new one
    else {
      try {
        this.pollPromise = this.pollOnce();

        await this.pollPromise;
      }
      catch (e) {
        delete this.pollPromise;

        throw e;
      }

      delete this.pollPromise;
    }
  }

  private waitForConfirmation(pin: number): Promise<boolean> {

    // TODO: не поднимать события пинов которые не были засетапены


    // it will be called immediately at the current tick.
    return new Promise<boolean>((resolve, reject) => {

      // TODO: нужно ещё удалить событие когда очищаем ожидание

      const handlerIndex: number = this.events.addListener(
        `${READ_RESULT_PREFIX}${pin}`,
        (level: boolean) => {
          this.events.removeListener(handlerIndex);
          clearTimeout(this.waitingFinalStateTimeouts[pin]);

          delete this.waitingFinalStateTimeouts[pin];

          resolve(level);
        }
      );

      this.waitingFinalStateTimeouts[pin] = setTimeout(() => {
        this.events.removeListener(handlerIndex);

        delete this.waitingFinalStateTimeouts[pin];

        reject(new Error(`Wait pin "${pin}" result timeout`));
      }, this.waitResultTimeoutSec * 1000);
    });
  }

  private setFinalState(pin: number, finalState: boolean) {

    // TODO: пересмотреть ещё раз, нужна ли зависимость от старого стейта ???

    // don't handle edge which is not suitable to edge that has been set up
    if (this.pinProps[pin]?.edge === Edge.rising && !finalState) {
      return;
    }
    else if (this.pinProps[pin]?.edge === Edge.falling && finalState) {
      return;
    }

    // TODO: если в итоге не изменилось значение? всеравно поднимать событие ???

    // set a new value
    this.state[pin] = finalState;
    // rise a event with the final state
    this.events.emit(pin, finalState);
  }

}
