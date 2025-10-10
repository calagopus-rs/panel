use serde::Deserialize;
use std::path::Path;

fn main() {
    let internal_list_extension = Path::new("../extensions/internal-list");
    let extensions_path = Path::new("../extensions");

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=../extensions");

    let mut packages = Vec::new();

    for dir in std::fs::read_dir(extensions_path).unwrap().flatten() {
        if !dir.file_type().unwrap().is_dir() || dir.file_name() == "internal-list" {
            continue;
        }

        let cargo_toml = match std::fs::read_to_string(dir.path().join("Cargo.toml")) {
            Ok(file) => file,
            Err(_) => continue,
        };

        #[derive(Deserialize)]
        struct CargoToml {
            package: CargoPackage,
        }

        #[derive(Deserialize)]
        struct CargoPackage {
            name: String,
            description: Option<String>,
            authors: Option<Vec<String>>,
            version: String,
        }

        let cargo_toml: CargoToml = toml::from_str(&cargo_toml).unwrap();
        packages.push((dir.file_name(), cargo_toml.package));
    }

    std::fs::create_dir_all(internal_list_extension).unwrap();
    std::fs::create_dir_all(internal_list_extension.join("src")).unwrap();

    let mut deps = String::new();

    for (path, package) in packages.iter() {
        deps.push_str(&package.name);
        deps.push_str(" = { path = \"../");
        deps.push_str(&path.to_string_lossy());
        deps.push_str("\" }\n");
    }

    std::fs::write(
        internal_list_extension.join("Cargo.toml"),
        format!(
            r#"[package]
name = "extension-internal-list"
version = {{ workspace = true }}
edition = {{ workspace = true }}

[dependencies]
shared = {{ workspace = true }}
{}"#,
            deps
        ),
    )
    .unwrap();

    let mut exts = String::new();

    for (_, package) in packages {
        let identifier = package.name.replace("-", "_");

        exts.push_str("\n        ConstructedExtension {\n");
        exts.push_str("            name: ");
        exts.push_str(&toml::Value::String(package.name).to_string());
        exts.push_str(",\n");
        exts.push_str("            description: ");
        exts.push_str(&toml::Value::String(package.description.unwrap_or_default()).to_string());
        exts.push_str(",\n");
        exts.push_str("            authors: &");
        exts.push_str(
            &toml::Value::Array(
                package
                    .authors
                    .unwrap_or_default()
                    .into_iter()
                    .map(toml::Value::String)
                    .collect(),
            )
            .to_string(),
        );
        exts.push_str(",\n");
        exts.push_str("            version: ");
        exts.push_str(&toml::Value::String(package.version).to_string());
        exts.push_str(",\n");
        exts.push_str("            extension: Box::new(");
        exts.push_str(&identifier);
        exts.push_str("::ExtensionStruct::default()),\n");
        exts.push_str("        },");
    }

    std::fs::write(
        internal_list_extension.join("src/lib.rs"),
        format!(
            r#"use shared::extensions::ConstructedExtension;

pub fn list() -> Vec<ConstructedExtension> {{
    vec![{}
    ]
}}
"#,
            exts,
        ),
    )
    .unwrap();
}
