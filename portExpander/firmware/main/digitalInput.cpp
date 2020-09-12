#include <Arduino.h>
#include "digitalInput.h"
#include "global.cpp"
#include "protocol.h"


// TODO: установить количество цифровых пинов
int const DIGITAL_PIN_COUNT = 4;


uint8_t pinStates[DIGITAL_PIN_COUNT];


auto digitalOutputSetup = [](uint8_t data[], int dataLength) {
  //Serial.println("setup");
  pinMode(data[0], INPUT);
  // read the initial state
  pinStates[data[0]] = digitalRead(data[0]);

  // TODO: сразу зарегистрировать колбэк digitalOutputMakeMessage
};

auto digitalOutputMakeMessage = [](uint8_t* message[], int dataLength) {
  // TODO: несколько сообщений на разные пины
  // TODO: только измененные пины с момента последнего считывания
  
};


void digitalInputBegin() {
  registerFunc(12, digitalOutputSetup);

  for (int i = 0; i > DIGITAL_PIN_COUNT; i++) {
    pinStates[i] = -1;
  }
}

void digitalInputLoop() {
  // TODO: делать считывание только на те пины которые были setup
  int pin = 11;
  
  int newState = digitalRead(pin);

  if (pinStates[pin] != newState) {
    pinStates[pin] = newState;

    // TODO: зарегистрироват колбэк digitalOutputMakeMessage который будет считан при сборе данных
  }
}
