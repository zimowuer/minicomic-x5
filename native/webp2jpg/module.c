#include <string.h>

#include "convert.h"
#include "jsmodules/JSCModuleExtension.h"
#include "quickjs/quickjs.h"

static JSValue convert_image(JSContext *ctx, JSValueConst this_value, int argc,
                             JSValueConst *argv) {
    const char *input;
    const char *output;
    int32_t max_width = 1020;
    int32_t quality = 86;
    int32_t segments = 0;
    int result;
    char error[160] = {0};

    (void)this_value;
    if (argc < 2) return JS_ThrowTypeError(ctx, "convert requires input and output paths");
    input = JS_ToCString(ctx, argv[0]);
    output = JS_ToCString(ctx, argv[1]);
    if (input == NULL || output == NULL) {
        if (input != NULL) JS_FreeCString(ctx, input);
        if (output != NULL) JS_FreeCString(ctx, output);
        return JS_EXCEPTION;
    }
    if (argc >= 3 && JS_ToInt32(ctx, &max_width, argv[2]) < 0) goto invalid_argument;
    if (argc >= 4 && JS_ToInt32(ctx, &quality, argv[3]) < 0) goto invalid_argument;
    if (argc >= 5 && JS_ToInt32(ctx, &segments, argv[4]) < 0) goto invalid_argument;

    result = webp_to_jpeg(input, output, max_width, quality, segments, error, sizeof(error));
    JS_FreeCString(ctx, input);
    JS_FreeCString(ctx, output);
    if (result != 0) return JS_ThrowInternalError(ctx, "%s", error);
    return JS_NewString(ctx, "ok");

invalid_argument:
    JS_FreeCString(ctx, input);
    JS_FreeCString(ctx, output);
    return JS_EXCEPTION;
}

static JSValue is_webp(JSContext *ctx, JSValueConst this_value, int argc,
                       JSValueConst *argv) {
    const char *path;
    int result;
    (void)this_value;
    if (argc < 1) return JS_ThrowTypeError(ctx, "isWebp requires a file path");
    path = JS_ToCString(ctx, argv[0]);
    if (path == NULL) return JS_EXCEPTION;
    result = file_is_webp(path);
    JS_FreeCString(ctx, path);
    return JS_NewBool(ctx, result);
}

static int module_init(JSContext *ctx, JSModuleDef *module) {
    if (JS_SetModuleExport(ctx, module, "convert",
                          JS_NewCFunction(ctx, convert_image, "convert", 5)) < 0) return -1;
    return JS_SetModuleExport(ctx, module, "isWebp",
                              JS_NewCFunction(ctx, is_webp, "isWebp", 1));
}

static JSModuleDef *module_load(JSContext *ctx, const char *module_name) {
    JSModuleDef *module;
    if (strcmp(module_name, "webp") != 0) return NULL;
    module = JS_NewCModule(ctx, module_name, module_init);
    if (module == NULL) return NULL;
    JS_AddModuleExport(ctx, module, "convert");
    JS_AddModuleExport(ctx, module, "isWebp");
    return module;
}

__attribute__((visibility("default"))) void custom_init_jsapis(void) {
    registerCModuleLoader("webp", module_load);
}
