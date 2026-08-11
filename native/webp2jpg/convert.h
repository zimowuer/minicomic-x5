#ifndef DOGE_WEBP2JPG_CONVERT_H
#define DOGE_WEBP2JPG_CONVERT_H

#include <stddef.h>

int webp_to_jpeg(const char *input_path, const char *output_path, int max_width,
                 int quality, int segments, char *error, size_t error_size);
int file_is_webp(const char *path);

#endif
