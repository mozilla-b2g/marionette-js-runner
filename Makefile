default: test

node_modules:
	npm install

.PHONY: test
test: node_modules
	./node_modules/.bin/mocha \
		test/mocha/child.js \
		test/mocha/integration.js \
		test/mocha/parent.js
