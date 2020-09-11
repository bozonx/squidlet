#ifndef Digital_Output_h
#define Digital_Output_h

#include <Arduino.h>

extern void (*functionsArray []) (uint8_t data[]);

void digitalOutputBegin();

#endif
