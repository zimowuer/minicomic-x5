#!/bin/bash

# Copyright (C) 2025 Langning Chen
# 
# This file is part of miniapp.
# 
# miniapp is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# miniapp is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with miniapp.  If not, see <https://www.gnu.org/licenses/>.

# Script configuration
set -e  # Exit immediately if a command exits with a non-zero status

# Global variables
VERBOSE=false

# Info log output
function log_info() {
    echo "[INFO] $*"
}

# Error log output  
function log_error() {
    echo "[ERROR] $*" >&2
}

# Verbose log output
function log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo "[VERBOSE] $*" >&2
    fi
}

# Create necessary directories
function create_directories() {
    log_info "Creating necessary directories..."
    
    if ! mkdir -p ui/libs; then
        log_error "Failed to create ui/libs directory"
        return 1
    fi
    
    if ! mkdir -p dist; then
        log_error "Failed to create dist directory"  
        return 1
    fi
    
    log_verbose "Directories created successfully"
}

# Find and setup toolchain
function setup_toolchain() {
    log_info "Setting up toolchain..."
    
    # X5 firmware is ARMv7 hard-float with glibc. Search both the CI location
    # and the repository-level tools directory, including a possible extra
    # extraction directory created on Windows.
    local compiler=$(find -L jsapi/toolchains tools -type f \
        -path "*glibc*" -name "arm-buildroot-linux-gnueabihf-gcc" 2>/dev/null | head -n 1)

    if [ -z "$compiler" ]; then
        log_error "No ARMv7 glibc compiler found in jsapi/toolchains/ or tools/"
        return 1
    fi
    compiler_dir=$(cd "$(dirname "$compiler")" && pwd)
    compiler="$compiler_dir/$(basename "$compiler")"
    local toolchain=$(dirname "$(dirname "$compiler")")
    log_info "Using toolchain: $toolchain"

    export CROSS_TOOLCHAIN_PREFIX="${compiler%gcc}"
    
    log_info "Using cross compiler prefix: $CROSS_TOOLCHAIN_PREFIX"
    log_verbose "Toolchain setup completed successfully"
}

# Build native library
function build_native() {
    log_info "Building native library..."

    # The vendored X5 library is a known-good full build that provides both
    # custom.scan and custom.jm. The reduced source tree only builds the
    # optional standalone fs module, so do not overwrite the full library
    # unless a maintainer explicitly opts in.
    if [ -f ui/libs/libjsapi_langningchen.so ] && [ "${FORCE_NATIVE_REBUILD:-0}" != "1" ]; then
        log_info "Using vendored full X5 native library (set FORCE_NATIVE_REBUILD=1 to rebuild)"
        return 0
    fi
    
    log_verbose "Running cmake configuration..."
    if ! cmake -S jsapi -B jsapi/build; then
        log_error "CMake configuration failed"
        return 1
    fi
    
    log_verbose "Running make build..."
    if ! make -C jsapi/build -j $(nproc); then
        log_error "Make build failed"
        return 1
    fi
    
    log_verbose "Copying shared library..."
    if ! cp jsapi/build/libjsapi_langningchen.so ui/libs/; then
        log_error "Failed to copy libjsapi_langningchen.so to ui/libs/"
        return 1
    fi
    
    log_info "Native library build completed successfully"
}

# Build and verify the X5-only WebP decoder before packaging the UI. This must
# never fall back to Doge's prebuilt module because its ABI may target another
# device or C library.
function build_webp_native() {
    log_info "Building X5 WebP module..."

    if [ -z "${CROSS_TOOLCHAIN_PREFIX:-}" ]; then
        if ! setup_toolchain; then
            log_error "Toolchain setup for WebP module failed"
            return 1
        fi
    fi

    if ! bash native/webp2jpg/build.sh; then
        log_error "WebP module build failed"
        return 1
    fi

    local module="ui/libs/libjsapi_webp.so"
    local readelf="${CROSS_TOOLCHAIN_PREFIX}readelf"
    if [ ! -s "$module" ]; then
        log_error "WebP module was not generated: $module"
        return 1
    fi
    if ! "$readelf" -h "$module" | grep -q "Machine:.*ARM"; then
        log_error "WebP module is not an ARM ELF library"
        return 1
    fi
    if ! "$readelf" -Ws "$module" | grep -q "custom_init_jsapis"; then
        log_error "WebP module does not export custom_init_jsapis"
        return 1
    fi

    log_info "X5 WebP module built and verified"
}

# Package UI
function package_ui() {
    log_info "Packaging UI..."
    
    if ! pnpm -C ui package; then
        log_error "UI packaging failed"
        return 1
    fi
    
    log_verbose "UI packaging completed successfully"
}

# Create final distribution
function create_distribution() {
    log_info "Creating final distribution..."
    
    local amr_file=$(find ui -name "800*.amr")
    if [ -z "$amr_file" ]; then
        log_error "No AMR file found matching pattern '800*.amr' in ui directory"
        return 1
    fi
    
    local toolchain_prefix="${CROSS_TOOLCHAIN_PREFIX:-arm-buildroot-linux-gnueabihf-}"
    local target_name="miniapp-$(basename "$toolchain_prefix" | sed 's/-$//').amr"
    
    log_verbose "Copying $amr_file to dist/$target_name"
    if ! cp "$amr_file" "dist/$target_name"; then
        log_error "Failed to copy AMR file to distribution directory"
        return 1
    fi
    
    log_info "Distribution created successfully: dist/$target_name"
}

# Main function
function main() {
    log_info "Starting miniapp build process..."
    
    # Execute build steps
    if ! create_directories; then
        log_error "Directory creation failed"
        exit 1
    fi
    
    if [ ! -f ui/libs/libjsapi_langningchen.so ] || [ "${FORCE_NATIVE_REBUILD:-0}" = "1" ]; then
        if ! setup_toolchain; then
            log_error "Toolchain setup failed"
            exit 1
        fi
    else
        log_info "Vendored native library found; skipping toolchain setup"
    fi
    
    if ! build_native; then
        log_error "Native library build failed"
        exit 1
    fi
    
    if ! build_webp_native; then
        log_error "WebP native library build failed"
        exit 1
    fi

    if ! package_ui; then
        log_error "UI packaging failed"
        exit 1
    fi
    
    if ! create_distribution; then
        log_error "Distribution creation failed"
        exit 1
    fi
    
    log_info "Build process completed successfully!"
}

# Run main function with all arguments
main "$@"
