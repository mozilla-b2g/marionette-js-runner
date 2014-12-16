default: lint test

b2g:
	./node_modules/.bin/mozilla-download \
		--product b2g \
		--channel tinderbox \
		--branch mozilla-central $@

.PHONY: node_modules
node_modules:
	npm install

.PHONY: test
test: node_modules b2g test-unit test-integration

.PHONY: lint
lint:
	gjslint --recurse . \
		--disable "220,225" \
		--exclude_directories "examples,node_modules,b2g,api-design,host"

.PHONY: test-integration
test-integration:
	./bin/marionette-mocha --host-log stdout $(shell find test/integration) -t 100s

.PHONY: test-logger
test-logger:
	./bin/marionette-mocha test/logger/console-proxy.js -t 100s --verbose

.PHONY: test-unit
test-unit:
	./node_modules/.bin/mocha -t 100s \
		test/*_test.js \
		test/bin/*_test.js
