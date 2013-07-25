default: test

b2g:
	./node_modules/marionette-b2gdesktop-host/bin/marionette-host-environment $@

node_modules:
	npm install

.PHONY: test-integration
test-integration:
	./bin/marionette-mocha \
		find test/integration -t 100s

.PHONY: test
test: node_modules b2g
	./node_modules/.bin/mocha -t 100s \
		test/mocha/parentrunner.js \
		test/childrunner.js \
		test/runtime.js \
		test/runtime/filterdata.js \
		test/marionette.js \
		test/bin/marionette-mocha.js && \
		make test-integration

.PHONY: ci
ci:
	Xvfb :99 &
	DISPLAY=:99 make test
