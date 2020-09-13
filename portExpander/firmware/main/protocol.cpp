#include <Arduino.h>
#include "protocol.h"
#include "global.cpp"


// Function callbacks by function number
void (*functioncCallbacks [FUNCTIONS_NUM]) (uint8_t data[], int dataLength) = {};
// Function callbacks by function number
void (*feedbackStack [FEEDBACK_STACK_LENGTH]) (uint8_t *feedbackNum, uint8_t argsData[], uint8_t *argsDataLength, uint8_t *hasMoreMessages) = {};
int feedbackStackLength = 0;
uint8_t packageStack[FEEDBACK_PACKAGES_STACK_LENGTH][MAX_PACKAGE_LENGTH_BYTES];
uint8_t packageLengthStack[FEEDBACK_PACKAGES_STACK_LENGTH];
int packageStackLength = 0;
// length of packages in the stack which has been read
int readPackagesLength = 0;


void registerFeedbackCallback(ReturnCb callback) {

  // TODO: проверить что нет переполнения массива
  
  feedbackStack[feedbackStackLength] = callback;

  feedbackStackLength++;
}

void registerFunc(uint8_t funcNum, FuncCb callback) {

  // TODO: проверить что номер ф-и в нужных пределах
  
  functioncCallbacks[funcNum] = callback;
}

uint8_t handlePackageLengthAsk() {
  if (packageStackLength == 0) {
    // there aren't any packages to be read, make new packages

    // TODO: нужно же формировать несколько сообщений в 1 пакет и только если длина сообщений превышает длину пакета то создавать новый пакет
    
    for (int i = 0; i < feedbackStackLength; i++) {
      uint8_t feedbackNum = 0;
      uint8_t argsData[MAX_ARGS_LENGTH_BYTES] = {0};
      uint8_t argsDataLength = 0;
      uint8_t hasMoreMessages = 0;
  
      // TODO: что делать с hasMoreMessages ????
      // TODO: как сохранить длину пакета в стэке ????
  
      feedbackStack[i](feedbackNum, argsData, argsDataLength, hasMoreMessages);
      // clear the callback
      feedbackStack[i] = 0;
  
      packageLengthStack[feedbackStackLength] = argsDataLength + 2;
      packageStack[feedbackStackLength][0] = argsDataLength + 1;
      packageStack[feedbackStackLength][1] = feedbackNum;

      for (int i = 0; i < argsDataLength; i++) {
        packageStack[feedbackStackLength][i + 2] = argsData[i];
      }
  
      feedbackStackLength++;
    }
    // flush callbacks. Means all of them has been read.
    feedbackStackLength = 0;
  }
  // return the length of the first one
  return packageLengthStack[0];
}

void handlePackageAsk(uint8_t *package, int lengthShouldBeRead) {
  if (packageStackLength == 0) {
    return;
  }

  // TODO: проверить readPackagesLength

  for (int i = 0; i < packageLengthStack[readPackagesLength]; i++) {
    package[i] == packageStack[readPackagesLength][i];
  }
  // mark package than is has been read
  readPackagesLength++;

  // TODO: проверить
  if (readPackagesLength >= packageStackLength) {
    // all done, clear
    packageStackLength = 0;
    readPackagesLength = 0;
  }

//    slave.writeRegisterToBuffer(0, 525);
//    slave.writeRegisterToBuffer(1, 1280);
//  package[0] = 2;
//  package[1] = 13;
//  package[2] = 5;
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
    uint8_t argsData[sizeOfArgs] = {0};
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
