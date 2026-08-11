#include "convert.h"

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "src/webp/decode.h"

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "../vendor/stb_image_write.h"

static void set_error(char *error, size_t error_size, const char *message) {
    if (error != NULL && error_size > 0) {
        snprintf(error, error_size, "%s", message);
    }
}

static unsigned char *read_file(const char *path, size_t *size) {
    FILE *file = fopen(path, "rb");
    unsigned char *data;
    long length;

    if (file == NULL) return NULL;
    if (fseek(file, 0, SEEK_END) != 0 || (length = ftell(file)) <= 0 ||
        fseek(file, 0, SEEK_SET) != 0) {
        fclose(file);
        return NULL;
    }

    data = (unsigned char *)malloc((size_t)length);
    if (data == NULL || fread(data, 1, (size_t)length, file) != (size_t)length) {
        free(data);
        fclose(file);
        return NULL;
    }

    fclose(file);
    *size = (size_t)length;
    return data;
}

int file_is_webp(const char *path) {
    unsigned char header[12];
    FILE *file = fopen(path, "rb");
    size_t read;
    if (file == NULL) return 0;
    read = fread(header, 1, sizeof(header), file);
    fclose(file);
    return read == sizeof(header) && memcmp(header, "RIFF", 4) == 0 &&
           memcmp(header + 8, "WEBP", 4) == 0;
}

int webp_to_jpeg(const char *input_path, const char *output_path, int max_width,
                 int quality, int segments, char *error, size_t error_size) {
    WebPDecoderConfig config;
    VP8StatusCode status;
    unsigned char *input;
    size_t input_size = 0;
    int width;
    int height;
    int result;
    unsigned char *pixels;
    unsigned char *recombined = NULL;

    if (max_width < 120 || max_width > 4096 || quality < 40 || quality > 100 ||
        segments < 0 || segments > 32) {
        set_error(error, error_size, "invalid conversion options");
        return 2;
    }

    errno = 0;
    input = read_file(input_path, &input_size);
    if (input == NULL) {
        snprintf(error, error_size, "cannot read input: %s", strerror(errno));
        return 3;
    }

    if (!WebPInitDecoderConfig(&config)) {
        set_error(error, error_size, "libwebp decoder ABI mismatch");
        free(input);
        return 4;
    }

    status = WebPGetFeatures(input, input_size, &config.input);
    if (status != VP8_STATUS_OK) {
        snprintf(error, error_size, "unsupported WebP image (status %d)", status);
        free(input);
        return 5;
    }

    width = config.input.width;
    height = config.input.height;
    if (width > max_width) {
        config.options.use_scaling = 1;
        config.options.scaled_width = max_width;
        config.options.scaled_height = (int)(((long long)height * max_width + width / 2) / width);
        width = config.options.scaled_width;
        height = config.options.scaled_height;
    }
    config.options.use_threads = 0;
    config.output.colorspace = MODE_RGB;

    status = WebPDecode(input, input_size, &config);
    free(input);
    if (status != VP8_STATUS_OK) {
        snprintf(error, error_size, "WebP decode failed (status %d)", status);
        WebPFreeDecBuffer(&config.output);
        return 6;
    }

    pixels = config.output.u.RGBA.rgba;
    if (segments > 1) {
        int block = height / segments;
        int remainder = height % segments;
        int target_y = 0;
        int source_stride = config.output.u.RGBA.stride;
        recombined = (unsigned char *)malloc((size_t)width * height * 3);
        if (recombined == NULL) {
            set_error(error, error_size, "cannot allocate recombination buffer");
            WebPFreeDecBuffer(&config.output);
            return 7;
        }
        for (int i = segments - 1; i >= 0; i--) {
            int source_y = i * block;
            int block_height = block + (i == segments - 1 ? remainder : 0);
            for (int row = 0; row < block_height; row++) {
                memcpy(recombined + (size_t)(target_y + row) * width * 3,
                       pixels + (size_t)(source_y + row) * source_stride,
                       (size_t)width * 3);
            }
            target_y += block_height;
        }
        pixels = recombined;
    }

    result = stbi_write_jpg(output_path, width, height, 3, pixels, quality);
    free(recombined);
    WebPFreeDecBuffer(&config.output);
    if (!result) {
        set_error(error, error_size, "cannot write JPEG output");
        return 8;
    }

    return 0;
}
