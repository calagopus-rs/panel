init:
	mkdir -p extensions/internal-list/src
	cp extensions/list.lib.rs extensions/internal-list/src/lib.rs
	cp extensions/list.Cargo.toml extensions/internal-list/Cargo.toml

build: init
	cargo build

run: init
	cargo run

build-release: init
	cargo build --release
