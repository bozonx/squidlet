#include <Arduino.h>
#include "helpers.h"


uint8_t getBitFromByte(uint8_t souceByte, uint8_t bitNum) {
  return ((souceByte >> bitNum)  & 0x01);
}

// get num of octet starting from 0
int getOctetNum(double bitNum) {
  return floor(bitNum / 8);
}

// get bit num (starts from 0) in octet in some data.
int getBitNumInOctet(double bitNum) {
  return bitNum - (floor(bitNum / 8) * 8);
}

void updateBitInByte(int &souceByte, uint8_t bitNum, uint8_t value) {
  if (value) {
    souceByte |= 1 << bitNum;
  }
  else {
    souceByte &= ~(1 << bitNum);
  }
}

void convertUint8ToUint16(uint8_t sourceArr8Bit[], int sourceLength, uint16_t resultArr16Bit[]) {
  for (int i = 0; i < sourceLength; i++) {
    uint16_t num16 = sourceArr8Bit[i];
    num16 = (num16<<8) | sourceArr8Bit[i + 1];

    resultArr16Bit[i / 2] = num16;

    i++;
  }
}

void convert16BitArrTo8Bit(uint16_t arr16[], int sizeofArr16, uint8_t resultArr8Bit[]) {
  for (int i = 0; i < sizeofArr16; i++) {
    uint8_t firstByte = (arr16[i] >> 8);
    uint8_t secondByte = arr16[i] & 0xff;

    resultArr8Bit[i * 2] = firstByte;
    resultArr8Bit[(i * 2) + 1] = secondByte;
  }
}



//int sizeOfPackage16Bit = sizeof(package16Bit)/sizeof(package16Bit[0]);
