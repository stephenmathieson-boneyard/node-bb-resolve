
BIN := node_modules/.bin
REPORTER ?= spec
TIMEOUT ?= 5s
JS = index.js
TESTS = $(wildcard test/*.js)

.PHONY: test
test: node_modules
	$(BIN)/mocha --reporter $(REPORTER) --timeout $(TIMEOUT)

node_modules: package.json
	@npm install
	@touch $@

coverage: node_modules $(JS) $(TESTS)
	@$(BIN)/istanbul cover $(BIN)/_mocha -- --reporter $(REPORTER)

.PHONY: clean
clean:
	rm -rf coverage
