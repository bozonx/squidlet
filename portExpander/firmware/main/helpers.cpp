#include <Arduino.h>
#include "helpers.h"


void convertUint8ToUint16(uint8_t *sourceArr8Bit, int sourceLength, uint16_t *resultArr16Bit) {
  for (int i = 0; i < sourceLength; i++) {
    uint16_t num16 = sourceArr8Bit[i];
    num16 = (num16<<8) | sourceArr8Bit[i + 1];

    resultArr16Bit[i / 2] = num16;

    i++;
  }
}
