use serde::Deserialize;
use std::path::Path;

fn main() {
    let internal_list_extension = Path::new("../backend-extensions/internal-list");
    let extensions_path = Path::new("../backend-extensions");

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=../backend-extensions");

    let mut packages = Vec::new();

    for dir in std::fs::read_dir(extensions_path).unwrap().flatten() {
        if !dir.file_type().unwrap().is_dir() || dir.file_name() == "internal-list" {
            continue;
        }

        let metadata_toml = match std::fs::read_to_string(dir.path().join("Metadata.toml")) {
            Ok(file) => file,
            Err(_) => continue,
        };

        let cargo_toml = match std::fs::read_to_string(dir.path().join("Cargo.toml")) {
            Ok(file) => file,
            Err(_) => continue,
        };

        #[derive(Deserialize)]
        struct MetadataToml {
            package_name: String,
            name: String,
            panel_version: semver::VersionReq,
        }

        #[derive(Deserialize)]
        struct CargoToml {
            package: CargoPackage,
        }

        #[derive(Deserialize)]
        struct CargoPackage {
            description: Option<String>,
            authors: Option<Vec<String>>,
            version: semver::Version,
        }

        let metadata_toml: MetadataToml = toml::from_str(&metadata_toml).unwrap();
        let cargo_toml: CargoToml = toml::from_str(&cargo_toml).unwrap();
        packages.push((dir.file_name(), metadata_toml, cargo_toml.package));
    }

    std::fs::create_dir_all(internal_list_extension).unwrap();
    std::fs::create_dir_all(internal_list_extension.join("src")).unwrap();

    let mut deps = String::new();

    for (path, metadata, _) in packages.iter() {
        deps.push_str(&metadata.package_name.replace('.', "_"));
        deps.push_str(" = { path = \"../");
        deps.push_str(&path.to_string_lossy());
        deps.push_str("\" }\n");
    }

    const CARGO_TEMPLATE_TOML: &str =
        include_str!("../backend-extensions/internal-list/Cargo.template.toml");

    std::fs::write(
        internal_list_extension.join("Cargo.toml"),
        format!("{CARGO_TEMPLATE_TOML}{}", deps),
    )
    .unwrap();

    let mut exts = String::new();

    for (_, metadata, package) in packages {
        exts.push_str(&format!(
            r#"
        ConstructedExtension {{
            metadata_toml: MetadataToml {{
                package_name: {}.to_string(),
                name: {}.to_string(),
                panel_version: semver::VersionReq::parse({}).unwrap(),
            }},
            description: {},
            authors: &{},
            version: semver::Version::parse({}).unwrap(),
            extension: Box::new({}::ExtensionStruct::default()),
        }},"#,
            toml::Value::String(metadata.package_name.clone()),
            toml::Value::String(metadata.name),
            toml::Value::String(metadata.panel_version.to_string()),
            toml::Value::String(package.description.unwrap_or_default()),
            toml::Value::Array(
                package
                    .authors
                    .unwrap_or_default()
                    .into_iter()
                    .map(toml::Value::String)
                    .collect(),
            ),
            toml::Value::String(package.version.to_string()),
            metadata.package_name.replace('.', "_"),
        ));
    }

    std::fs::write(
        internal_list_extension.join("src/lib.rs"),
        format!(
            r#"#![allow(clippy::default_constructed_unit_structs)]
#![allow(unused_imports)]

use shared::extensions::{{ConstructedExtension, distr::MetadataToml}};

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
