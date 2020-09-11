#include <Arduino.h>
#include "global.cpp"


// array of function pointers
void (*functionsArray []) (uint8_t data[]) = {};


void convert16BitArrTo8Bit(uint16_t arr16[], uint8_t *result) {
  for (int i = 0; i < sizeof(arr16); i++) {
    uint8_t firstByte = (arr16[i] >> 8);
    uint8_t secondByte = arr16[i] & 0xff;

    result[i * 2] = firstByte;
    result[(i * 2) + 1] = secondByte;
  }
}


void handleIncomeData(uint16_t package16Bit[]) {
  int sizeOfPackage16Bit = sizeof(package16Bit)/sizeof(package16Bit[0]);
  int sizeOfPackage8Bit = sizeOfPackage16Bit * 2;
  uint8_t package8Bit[sizeOfPackage8Bit];

  Serial.print("sizeOfPackage16Bit - ");
  Serial.println(sizeOfPackage16Bit);
  
  convert16BitArrTo8Bit(package16Bit, package8Bit);

  for (int i = 0; i < sizeOfPackage8Bit; i++) {
    uint8_t sizeOfArgs = package8Bit[i];
    uint8_t funcNum = package8Bit[i + 1];

    if (sizeOfArgs == 0 && funcNum == 0) {
      break;
    }
    
    int dataFirstByte = i + 2;
    uint8_t argsData[sizeOfArgs];

    i = i + 2;

    if (sizeOfArgs > 0) {
      for (int l = 0; l < sizeOfArgs; l++) {
        argsData[l] = package8Bit[dataFirstByte + l];
  
        i++;
  
        Serial.print(l);
        Serial.print(" - ");
        Serial.println(i);
      }      
    }

    Serial.print(i);
    Serial.println(" - i");
    Serial.print(sizeOfArgs);
    Serial.println(" - sizeOfArgs");
    Serial.print(funcNum);
    Serial.println(" - funcNum");
    Serial.print(argsData[0]);
    Serial.println(" - argsData[0]");
  }
}

//uint16_t prepareOutcomeData(uint16_t address, uint16_t length) {
//  uint16_t package[length];
//  
//  return package;
//}
