#include <Arduino.h>
#include "protocol.h"
#include "global.cpp"


// Function callbacks by function number
void (*functioncCallbacks [FUNCTIONS_NUM]) (uint8_t data[], int dataLength) = {};
// Function callbacks by function number
void (*feedbackStack [FEEDBACK_STACK_LENGTH]) (uint8_t* message[], int *messageLength, int *hasMoreMessages) = {};
// last element index
int feedbackStackLastIndex = 0;


boolean hasReturnCb(uint8_t funcNum) {
  
  // TODO: register add
  
  return false;
}

void registerReturnCallback(uint8_t funcNum, ReturnCb callback) {

  // TODO: проверить что нет переполнения массива
  
  feedbackStack[feedbackStackLastIndex] = callback;

  feedbackStackLastIndex++;
}

void registerFunc(uint8_t funcNum, FuncCb callback) {

  // TODO: проверить что номер ф-и в нужных пределах
  
  functioncCallbacks[funcNum] = callback;
}

uint8_t handlePackageLengthAsk() {
  // TODO: сформировать сообщения и сохранить пакеты в буфер
  // TODO: если повторно запрашивается длина то отдать длину первого пакета в буфере
  
  return 3;
}

void handlePackageAsk(uint8_t *package, int lengthShouldBeRead) {
    
  // TODO: взять 1е сообщение из буфера и записать в регистры и удалить сообщение из буфера
  // TODO: если других сообщений уже нет то удалить буфер и ждать новых запросов
  // [length of message(2), functionNum(13), data(5)]

  
//    slave.writeRegisterToBuffer(0, 525);
//    slave.writeRegisterToBuffer(1, 1280);
  package[0] = 2;
  package[1] = 13;
  package[2] = 5;
  // TODO: этого быть не должно - проверить во внешнем коде что подставляется лишний 0
  //package[3] = 0;
}

// Split messages in package, the first byte is size of args and the seconf is function name.
// Call function at any message in the package.
void handleIncomeData(uint8_t *package8Bit, int sizeOfPackage8Bit) {
  for (int i = 0; i < sizeOfPackage8Bit; i++) {
    // if is odd byte then stop cycle
    if (i + 1 >= sizeOfPackage8Bit) {
      break;
    }

    uint8_t sizeOfArgs = package8Bit[i];
    uint8_t funcNum = package8Bit[i + 1];
    // if the end of data of package
    if (funcNum == 0) {
      break;
    }
    
    int dataFirstByte = i + 2;
    uint8_t argsData[sizeOfArgs];
    // shift of function num
    i++;
    // read args data of there are any
    for (int l = 0; l < sizeOfArgs; l++) {
      argsData[l] = package8Bit[dataFirstByte + l];
      // shift the main interator
      i++;
    }

    // TODO: how to check if function exists ???

    // call function
    functioncCallbacks[funcNum](argsData, sizeOfArgs);
  }
}
