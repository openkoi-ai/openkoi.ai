#!/bin/sh
# OpenKoi installer
# Usage: curl -fsSL https://openkoi.ai/install.sh | sh
#
# Installs the latest release of OpenKoi from GitHub.
# Supports Linux (x86_64, ARM64) and macOS (x86_64, ARM64).
# Installs to ~/.local/bin by default, or /usr/local/bin with --global.

set -eu

REPO="openkoi-ai/openkoi"
BINARY="openkoi"
GLOBAL=0
INSTALL_DIR="$HOME/.local/bin"

# --- Helpers ---

info() {
    printf "\033[1;34m::\033[0m %s\n" "$1"
}

success() {
    printf "\033[1;32m::\033[0m %s\n" "$1"
}

error() {
    printf "\033[1;31merror:\033[0m %s\n" "$1" >&2
    exit 1
}

need() {
    if ! command -v "$1" > /dev/null 2>&1; then
        error "required command not found: $1"
    fi
}

# --- Parse arguments ---

for arg in "$@"; do
    case "$arg" in
        --global|-g)
            GLOBAL=1
            INSTALL_DIR="/usr/local/bin"
            ;;
        --help|-h)
            printf "Usage: curl -fsSL https://openkoi.ai/install.sh | sh [-s -- OPTIONS]\n\n"
            printf "Options:\n"
            printf "  --global, -g    Install to /usr/local/bin (requires sudo)\n"
            printf "  --help, -h      Show this help\n"
            exit 0
            ;;
        *)
            error "unknown option: $arg"
            ;;
    esac
done

# --- Detect platform ---

detect_platform() {
    OS="$(uname -s)"
    ARCH="$(uname -m)"

    case "$OS" in
        Linux)  OS="linux" ;;
        Darwin) OS="macos" ;;
        *)      error "unsupported operating system: $OS (only Linux and macOS are supported)" ;;
    esac

    case "$ARCH" in
        x86_64|amd64)   ARCH="x86_64" ;;
        aarch64|arm64)   ARCH="arm64" ;;
        *)               error "unsupported architecture: $ARCH (only x86_64 and ARM64 are supported)" ;;
    esac

    ARCHIVE="${BINARY}-${OS}-${ARCH}.tar.gz"
}

# --- Resolve latest version ---

resolve_version() {
    info "fetching latest version..."

    # Use GitHub API to get the latest release tag
    API_URL="https://api.github.com/repos/${REPO}/releases/latest"

    if command -v curl > /dev/null 2>&1; then
        VERSION="$(curl -fsSL "$API_URL" 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4)"
    elif command -v wget > /dev/null 2>&1; then
        VERSION="$(wget -qO- "$API_URL" 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4)"
    else
        error "either curl or wget is required"
    fi

    if [ -z "$VERSION" ]; then
        error "could not determine the latest version. Check https://github.com/${REPO}/releases"
    fi

    # Validate version looks like a tag (vYYYY.M.D or vX.Y.Z)
    case "$VERSION" in
        v[0-9]*) ;;
        *) error "unexpected version format: ${VERSION}" ;;
    esac

    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${ARCHIVE}"
    CHECKSUM_URL="${DOWNLOAD_URL}.sha256"
}

# --- Download ---

download() {
    WORK_DIR="$(mktemp -d)"
    trap 'rm -rf "$WORK_DIR"' EXIT

    info "downloading ${BINARY} ${VERSION} for ${OS}/${ARCH}..."

    if command -v curl > /dev/null 2>&1; then
        curl -fsSL "$DOWNLOAD_URL" -o "${WORK_DIR}/${ARCHIVE}" || error "download failed. Is ${VERSION} released for ${OS}/${ARCH}?"
        curl -fsSL "$CHECKSUM_URL" -o "${WORK_DIR}/${ARCHIVE}.sha256" 2>/dev/null || true
    elif command -v wget > /dev/null 2>&1; then
        wget -q "$DOWNLOAD_URL" -O "${WORK_DIR}/${ARCHIVE}" || error "download failed. Is ${VERSION} released for ${OS}/${ARCH}?"
        wget -q "$CHECKSUM_URL" -O "${WORK_DIR}/${ARCHIVE}.sha256" 2>/dev/null || true
    fi

    # Verify checksum if available
    if [ -f "${WORK_DIR}/${ARCHIVE}.sha256" ] && [ -s "${WORK_DIR}/${ARCHIVE}.sha256" ]; then
        info "verifying checksum..."
        EXPECTED="$(cut -d' ' -f1 < "${WORK_DIR}/${ARCHIVE}.sha256")"
        if command -v sha256sum > /dev/null 2>&1; then
            ACTUAL="$(sha256sum "${WORK_DIR}/${ARCHIVE}" | cut -d' ' -f1)"
        elif command -v shasum > /dev/null 2>&1; then
            ACTUAL="$(shasum -a 256 "${WORK_DIR}/${ARCHIVE}" | cut -d' ' -f1)"
        else
            info "warning: no sha256sum or shasum found, skipping checksum verification"
            ACTUAL=""
        fi
        if [ -n "$ACTUAL" ] && [ "$EXPECTED" != "$ACTUAL" ]; then
            error "checksum mismatch (expected ${EXPECTED}, got ${ACTUAL})"
        fi
    fi
}

# --- Install ---

install_binary() {
    info "extracting..."
    tar xzf "${WORK_DIR}/${ARCHIVE}" -C "${WORK_DIR}"

    if [ ! -f "${WORK_DIR}/${BINARY}" ]; then
        error "binary not found in archive"
    fi

    # Create install directory if needed
    if [ ! -d "$INSTALL_DIR" ]; then
        mkdir -p "$INSTALL_DIR"
    fi

    info "installing to ${INSTALL_DIR}/${BINARY}..."

    if [ "$GLOBAL" -eq 1 ]; then
        if command -v install > /dev/null 2>&1; then
            sudo install -m 755 "${WORK_DIR}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
        else
            sudo cp "${WORK_DIR}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
            sudo chmod 755 "${INSTALL_DIR}/${BINARY}"
        fi
    else
        if command -v install > /dev/null 2>&1; then
            install -m 755 "${WORK_DIR}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
        else
            cp "${WORK_DIR}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
            chmod 755 "${INSTALL_DIR}/${BINARY}"
        fi
    fi
}

# --- Post-install ---

post_install() {
    success "${BINARY} ${VERSION} installed to ${INSTALL_DIR}/${BINARY}"

    # Check if install dir is in PATH
    case ":${PATH}:" in
        *":${INSTALL_DIR}:"*) ;;
        *)
            printf "\n"
            info "add ${INSTALL_DIR} to your PATH:"
            printf "\n"
            SHELL_NAME="$(basename "${SHELL:-/bin/sh}")"
            case "$SHELL_NAME" in
                zsh)
                    printf "  echo 'export PATH=\"%s:\$PATH\"' >> ~/.zshrc\n" "$INSTALL_DIR"
                    printf "  source ~/.zshrc\n"
                    ;;
                bash)
                    printf "  echo 'export PATH=\"%s:\$PATH\"' >> ~/.bashrc\n" "$INSTALL_DIR"
                    printf "  source ~/.bashrc\n"
                    ;;
                fish)
                    printf "  set -Ux fish_user_paths %s \$fish_user_paths\n" "$INSTALL_DIR"
                    ;;
                *)
                    printf "  export PATH=\"%s:\$PATH\"\n" "$INSTALL_DIR"
                    ;;
            esac
            printf "\n"
            ;;
    esac
}

# --- Main ---

main() {
    detect_platform
    resolve_version
    download
    install_binary
    post_install
}

main
