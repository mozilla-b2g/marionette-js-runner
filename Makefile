default: test

node_modules:
	npm install

.PHONY: test
test: node_modules
	./node_modules/.bin/mocha \
		test/mocha/parentrunner.js \
		test/childrunner.js \
		test/runtime/filterdata.js \
		test/marionette.js \
		test/bin/marionette-mocha.js
