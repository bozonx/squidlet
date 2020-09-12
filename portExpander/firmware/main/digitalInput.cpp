#include <Arduino.h>
#include "digitalInput.h"
#include "global.cpp"
#include "protocol.h"


int const DIGITAL_INPUT_SETUP_FUNC = 12;
int const DIGITAL_INPUT_RETURN_FUNC = 13;
// TODO: установить количество цифровых пинов
int const DIGITAL_PIN_COUNT = 4;
int const NOT_USED_PIN = -1;


// TODO: можно ли оптимизировать, использовать хэш например???
uint8_t pinStates[DIGITAL_PIN_COUNT];


auto digitalOutputMakeMessage = [](uint8_t* message[], int dataLength) {
  // TODO: несколько сообщений на разные пины
  // TODO: только измененные пины с момента последнего считывания
  // TODO: нужно дать понять что будут ещё сообщения
  
};

auto digitalOutputSetup = [](uint8_t data[], int dataLength) {
  //Serial.println("setup");
  pinMode(data[0], INPUT);
  // read the initial state
  pinStates[data[0]] = digitalRead(data[0]);

  registerReturnCallback(DIGITAL_INPUT_RETURN_FUNC, digitalOutputMakeMessage);
};



void digitalInputBegin() {
  registerFunc(DIGITAL_INPUT_SETUP_FUNC, digitalOutputSetup);

  for (int i = 0; i > DIGITAL_PIN_COUNT; i++) {
    pinStates[i] = NOT_USED_PIN;
  }
}

void digitalInputLoop() {
  for (int pin = 0; pin > DIGITAL_PIN_COUNT; pin++) {
    if (pinStates[pin] == NOT_USED_PIN) {
      continue;
    }

    int newState = digitalRead(pin);
  
    if (pinStates[pin] != newState) {
      pinStates[pin] = newState;
  
      registerReturnCallback(DIGITAL_INPUT_RETURN_FUNC, digitalOutputMakeMessage);
    }
  }
}
