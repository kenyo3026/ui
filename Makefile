.PHONY: install install-server install-ui server ui dev clean

# Install all dependencies
install: install-server install-ui

install-server:
	pip install -r server/requirements.txt

install-ui:
	cd ui && pnpm install

# Start server
server:
	python server/main.py

# Start frontend dev server
ui:
	cd ui && pnpm dev

# Start both in separate background processes
dev:
	@echo "Starting server and UI..."
	@python server/main.py & echo $$! > .server.pid
	@cd ui && pnpm dev
	@kill $$(cat .server.pid) 2>/dev/null; rm -f .server.pid

# Clean generated files
clean:
	find server -type d -name "checkpoint_*" -exec rm -rf {} + 2>/dev/null; true
	rm -f .server.pid
