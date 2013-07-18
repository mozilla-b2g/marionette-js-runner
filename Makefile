default: test

node_modules:
	npm install

.PHONY: test
test: node_modules integration
	./node_modules/.bin/mocha \
		test/mocha/child.js \
		test/mocha/parent.js

.PHONY: integration
integration:
	./node_modules/.bin/mocha test/mocha/integration

