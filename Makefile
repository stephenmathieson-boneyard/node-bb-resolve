
BIN := node_modules/.bin
REPORTER ?= spec
JS = index.js
TESTS = $(wildcard test/*.js)

.PHONY: test
test: node_modules
	@$(BIN)/mocha --reporter $(REPORTER)

node_modules: package.json
	@npm install

coverage: node_modules $(JS) $(TESTS)
	@$(BIN)/istanbul cover $(BIN)/_mocha -- --reporter $(REPORTER)

.PHONY: clean
clean:
	rm -rf coverage
