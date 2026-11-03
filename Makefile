# Kiro's Ghost Sokoban — developer tasks
#
# This is a vanilla JS / ES modules browser game: no bundler, no npm install.
# The only hard requirement is a local HTTP server, because ES modules and
# fetch() of the .sok level files do not work over the file:// protocol.

SHELL   := /bin/bash
PYTHON  ?= python3
PORT    ?= 8080
URL     := http://localhost:$(PORT)

SRC_DIR    := src
LEVELS_DIR := levels
JS_FILES   := $(shell find $(SRC_DIR) -name '*.js' 2>/dev/null)

# Firefox is the target browser (same intent as start.sh). Resolution order:
#   1. a `firefox` binary on PATH (Linux, Homebrew)
#   2. the macOS app bundle, launched through `open -a`
# GENERIC_OPENER is only a fallback when Firefox is not installed at all.
FIREFOX_BIN     := $(shell command -v firefox 2>/dev/null)
FIREFOX_APP     := $(firstword $(wildcard /Applications/Firefox.app $(HOME)/Applications/Firefox.app))
GENERIC_OPENER  := $(shell command -v open 2>/dev/null || command -v xdg-open 2>/dev/null)

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@echo "Kiro's Ghost Sokoban"
	@echo ""
	@echo "Usage: make <target> [PORT=8080]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

## ---------------------------------------------------------------- run

.PHONY: serve
serve: ## Serve the game locally, default port 8080 (Ctrl-C to stop)
	@echo "Serving $(CURDIR) at $(URL)"
	@$(PYTHON) -m http.server $(PORT)

.PHONY: run
run: ## Launch Firefox on the game, then serve it (this is the one you want)
	@$(MAKE) --no-print-directory open
	@$(MAKE) --no-print-directory serve

.PHONY: open firefox
firefox: open
open: ## Open the game URL in Firefox (falls back to the default browser)
ifneq ($(FIREFOX_BIN),)
	@echo "Opening $(URL) in Firefox"
	@( sleep 1 && "$(FIREFOX_BIN)" "$(URL)" >/dev/null 2>&1 & )
else ifneq ($(FIREFOX_APP),)
	@echo "Opening $(URL) in Firefox"
	@( sleep 1 && open -a "$(FIREFOX_APP)" "$(URL)" >/dev/null 2>&1 & )
else ifneq ($(GENERIC_OPENER),)
	@echo "Firefox not found; opening $(URL) in the default browser"
	@( sleep 1 && $(GENERIC_OPENER) "$(URL)" >/dev/null 2>&1 & )
else
	@echo "No browser found. Open $(URL) manually."
endif

.PHONY: stop
stop: ## Stop whatever is listening on the serve port
	@pids=$$(lsof -ti tcp:$(PORT) 2>/dev/null); \
	if [ -z "$$pids" ]; then \
		echo "Nothing listening on port $(PORT)"; \
	else \
		echo "Stopping PID(s) on port $(PORT): $$pids"; \
		kill $$pids; \
	fi

## ---------------------------------------------------------------- checks

.PHONY: check
check: syntax levels entrypoints test ## Run all static checks + unit tests

.PHONY: syntax
syntax: ## Parse every JS module with node --check
	@command -v node >/dev/null 2>&1 || { echo "node not found; skipping syntax check"; exit 0; }
	@fail=0; \
	for f in $(JS_FILES); do \
		node --check "$$f" || fail=1; \
	done; \
	if [ $$fail -ne 0 ]; then echo "Syntax errors found"; exit 1; fi; \
	echo "Syntax OK: $(words $(JS_FILES)) module(s)"

.PHONY: levels
levels: ## Check that level files exist and are non-empty
	@shopt -s nullglob; \
	files=($(LEVELS_DIR)/*.sok); \
	if [ $${#files[@]} -eq 0 ]; then echo "No .sok files in $(LEVELS_DIR)/"; exit 1; fi; \
	for f in "$${files[@]}"; do \
		if [ ! -s "$$f" ]; then echo "Empty level file: $$f"; exit 1; fi; \
		echo "  $$f ($$(wc -l < "$$f" | tr -d ' ') lines)"; \
	done; \
	echo "Levels OK: $${#files[@]} file(s)"

.PHONY: entrypoints
entrypoints: ## Check that required entry files are present
	@fail=0; \
	for f in index.html $(SRC_DIR)/main.js $(SRC_DIR)/config.js; do \
		if [ ! -f "$$f" ]; then echo "Missing: $$f"; fail=1; fi; \
	done; \
	if [ $$fail -ne 0 ]; then exit 1; fi; \
	echo "Entrypoints OK"

TEST_FILES := $(wildcard test/*.test.js)

.PHONY: test
test: ## Run the unit tests for the pure core (Node built-in runner, no deps)
	@command -v node >/dev/null 2>&1 || { echo "node not found; skipping tests"; exit 0; }
	@node --test $(TEST_FILES)
	@echo ""
	@echo "Note: unit tests cover pure core logic only. Full gameplay/rendering is"
	@echo "verified by hand — procedures in aidlc-docs/construction/build-and-test/."

## ---------------------------------------------------------------- housekeeping

.PHONY: clean
clean: ## Remove .DS_Store files and Python caches
	@find . -path ./.git -prune -o -name '.DS_Store' -print -delete
	@find . -path ./.git -prune -o -name '__pycache__' -type d -print -exec rm -rf {} +
	@echo "Clean"
