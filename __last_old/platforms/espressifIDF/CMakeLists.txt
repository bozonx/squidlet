# The following five lines of boilerplate have to be in your project's
# CMakeLists in this exact order for cmake to work correctly
cmake_minimum_required(VERSION 3.5)

include($ENV{IDF_PATH}/tools/cmake/project.cmake)
include_directories(../build/mjs)
#include_directories(../build/QuickJS)
#include_directories(./qjs)
project(blink)
