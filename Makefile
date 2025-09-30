init:
	mkdir -p extensions/internal-list/src
	touch extensions/internal-list/src/lib.rs
	echo '[package]\nname = "extension-internal-list"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]' > extensions/internal-list/Cargo.toml

build: init
	cargo build --manifest-path extensions/internal-list/Cargo.toml

run: init
	cargo run --manifest-path extensions/internal-list/Cargo.toml

build-release: init
	cargo build --release --manifest-path extensions/internal-list/Cargo.toml
