#include <stdio.h>
#include <stdlib.h>
#include "convert.h"

static int parse_number(const char *value, int fallback, int minimum, int maximum) {
    char *end = NULL;
    long parsed = strtol(value, &end, 10);
    if (end == value || *end != '\0' || parsed < minimum || parsed > maximum) return fallback;
    return (int)parsed;
}

int main(int argc, char **argv) {
    int max_width;
    int quality;
    int segments;
    int result;
    char error[160] = {0};

    if (argc < 3 || argc > 6) {
        fprintf(stderr, "usage: %s input.webp output.jpg [max_width] [quality] [segments]\n", argv[0]);
        return 2;
    }

    max_width = argc >= 4 ? parse_number(argv[3], 1020, 120, 4096) : 1020;
    quality = argc >= 5 ? parse_number(argv[4], 86, 40, 100) : 86;
    segments = argc >= 6 ? parse_number(argv[5], 0, 0, 32) : 0;
    result = webp_to_jpeg(argv[1], argv[2], max_width, quality, segments, error, sizeof(error));
    if (result != 0) fprintf(stderr, "%s\n", error);
    return result;
}
