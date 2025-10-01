init:
	mkdir -p extensions/internal-list/src
	cp extensions/list.lib.rs extensions/internal-list/src/lib.rs
	cp extensions/list.Cargo.toml extensions/internal-list/Cargo.toml

build: init
	cargo build --manifest-path extensions/internal-list/Cargo.toml

run: init
	cargo run --manifest-path extensions/internal-list/Cargo.toml

build-release: init
	cargo build --release --manifest-path extensions/internal-list/Cargo.toml
