// Copyright (C) 2025 Template Author
// SPDX-License-Identifier: GPL-3.0-or-later

#include "JSAPI.hpp"
#include "FileSystem.hpp"

#include <jsmodules/JSCModuleExtension.h>
#include <quickjs/quickjs.h>

#include <cstring>

namespace {

int customModuleInit(JSContext* ctx, JSModuleDef* module)
{
    JS_SetModuleExport(ctx, module, "default", JS_NewObject(ctx));
    return 0;
}

JSModuleDef* customModuleLoad(JSContext* ctx, const char* moduleName)
{
    if (!moduleName || std::strcmp(moduleName, "custom") != 0) return NULL;
    JSModuleDef* module = JS_NewCModule(ctx, moduleName, customModuleInit);
    if (!module) return NULL;
    JS_AddModuleExport(ctx, module, "default");
    return module;
}

}  // namespace

extern "C" JQUICK_EXPORT void custom_init_jsapis()
{
    registerCModuleLoader("custom", &customModuleLoad);
    registerCModuleLoader("fs", &fs_module_load);
}
