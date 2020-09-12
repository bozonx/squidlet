#include <Arduino.h>
#include "protocol.h"
#include "global.cpp"


// array of function pointers
void (*functionsArray [FUNCTIONS_NUM]) (uint8_t data[], int dataLength) = {};


void convert16BitArrTo8Bit(uint16_t arr16[], int sizeofArr, uint8_t *result) {
  for (int i = 0; i < sizeofArr; i++) {
    uint8_t firstByte = (arr16[i] >> 8);
    uint8_t secondByte = arr16[i] & 0xff;

    result[i * 2] = firstByte;
    result[(i * 2) + 1] = secondByte;
  }
}


void registerFunc(uint8_t funcNum, FuncCb callback) {
  functionsArray[funcNum] = callback;
}

void handleIncomeData(uint16_t *package16Bit, int sizeOfPackage16Bit) {
  int sizeOfPackage8Bit = sizeOfPackage16Bit * 2;
  uint8_t package8Bit[sizeOfPackage8Bit];

  convert16BitArrTo8Bit(package16Bit, sizeOfPackage16Bit, package8Bit);

  for (int i = 0; i < sizeOfPackage8Bit; i++) {
    if (i + 1 >= sizeOfPackage8Bit) {
      break;
    }

    uint8_t sizeOfArgs = package8Bit[i];
    uint8_t funcNum = package8Bit[i + 1];

    if (sizeOfArgs == 0 && funcNum == 0) {
      break;
    }
    
    int dataFirstByte = i + 2;
    uint8_t argsData[sizeOfArgs];

    // shift of function num
    i++;

    if (sizeOfArgs > 0) {
      for (int l = 0; l < sizeOfArgs; l++) {
        argsData[l] = package8Bit[dataFirstByte + l];
  
        i++;
      }      
    }

    // TODO: how to check if function exists ???

    // call function
    functionsArray[funcNum](argsData, sizeOfArgs);
  }
}

//uint16_t prepareOutcomeData(uint16_t address, uint16_t length) {
//  uint16_t package[length];
//  
//  return package;
//}
