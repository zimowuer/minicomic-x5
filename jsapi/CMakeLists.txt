cmake_minimum_required(VERSION 3.10)
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

if(NOT DEFINED ENV{CROSS_TOOLCHAIN_PREFIX})
    message(FATAL_ERROR "CROSS_TOOLCHAIN_PREFIX environment variable is not set")
endif()

set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm)
set(CMAKE_C_COMPILER "$ENV{CROSS_TOOLCHAIN_PREFIX}gcc")
set(CMAKE_CXX_COMPILER "$ENV{CROSS_TOOLCHAIN_PREFIX}g++")

execute_process(
    COMMAND ${CMAKE_C_COMPILER} -print-sysroot
    OUTPUT_VARIABLE TOOLCHAIN_SYSROOT
    OUTPUT_STRIP_TRAILING_WHITESPACE
)
if(TOOLCHAIN_SYSROOT)
    set(CMAKE_SYSROOT "${TOOLCHAIN_SYSROOT}")
endif()

project(jsapi_langningchen C CXX)

add_library(jsapi_langningchen SHARED
    src/JSAPI.cpp
    src/FileSystem.cpp
)

target_include_directories(jsapi_langningchen PRIVATE
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_SOURCE_DIR}/iot-miniapp-sdk/include
)

target_compile_features(jsapi_langningchen PRIVATE cxx_std_11)
target_compile_options(jsapi_langningchen PRIVATE
    -Wall
    -Wextra
    -Werror=return-type
    -Wno-unused-parameter
    -fPIC
)
target_link_libraries(jsapi_langningchen PRIVATE
    pthread
    -static-libstdc++
    -static-libgcc
    -Wl,--unresolved-symbols=ignore-all
)

set_target_properties(jsapi_langningchen PROPERTIES
    OUTPUT_NAME jsapi_langningchen
    PREFIX "lib"
)
