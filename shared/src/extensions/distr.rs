use anyhow::Context;
use ignore::gitignore::GitignoreBuilder;
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    io::{Read, Write},
    path::Path,
};
use utoipa::ToSchema;
use zip::write::FileOptions;

#[derive(ToSchema, Deserialize, Serialize)]
pub struct MetadataToml {
    pub package_name: String,
    pub name: String,
    #[schema(value_type = String)]
    pub panel_version: semver::VersionReq,
}

impl MetadataToml {
    #[inline]
    pub fn get_package_identifier(&self) -> String {
        Self::convert_package_name_to_identifier(&self.package_name)
    }

    #[inline]
    pub fn convert_package_name_to_identifier(package_name: &str) -> String {
        package_name.replace('.', "_")
    }

    #[inline]
    pub fn convert_identifier_to_package_name(identifier: &str) -> String {
        identifier.replace('_', ".")
    }
}

#[derive(Deserialize, Serialize)]
pub struct CargoPackage {
    pub description: String,
    pub authors: Vec<String>,
    pub version: semver::Version,
}

#[derive(Deserialize, Serialize)]
pub struct CargoToml {
    pub package: CargoPackage,
    pub dependencies: BTreeMap<String, toml::Value>,
}

#[derive(Deserialize, Serialize)]
pub struct PackageJson {
    pub dependencies: BTreeMap<String, String>,
}

pub struct ExtensionDistrFile {
    zip: zip::ZipArchive<std::fs::File>,

    pub metadata_toml: MetadataToml,
    pub cargo_toml: CargoToml,
    pub package_json: PackageJson,
}

impl ExtensionDistrFile {
    pub fn parse_from_file(file: std::fs::File) -> Result<Self, anyhow::Error> {
        let mut zip = zip::ZipArchive::new(file)?;

        let mut metadata_toml = zip.by_name("Metadata.toml")?;
        let mut metadata_toml_bytes = vec![0; metadata_toml.size() as usize];
        metadata_toml.read_exact(&mut metadata_toml_bytes)?;
        drop(metadata_toml);
        let metadata_toml: MetadataToml = toml::from_slice(&metadata_toml_bytes)?;

        let mut cargo_toml = zip.by_name("backend/Cargo.toml")?;
        let mut cargo_toml_bytes = vec![0; cargo_toml.size() as usize];
        cargo_toml.read_exact(&mut cargo_toml_bytes)?;
        drop(cargo_toml);

        let cargo_toml: CargoToml = toml::from_slice(&cargo_toml_bytes)?;

        let mut package_json = zip.by_name("frontend/package.json")?;
        let mut package_json_bytes = vec![0; package_json.size() as usize];
        package_json.read_exact(&mut package_json_bytes)?;
        drop(package_json);

        let package_json: PackageJson = serde_json::from_slice(&package_json_bytes)?;

        let mut this = Self {
            zip,
            metadata_toml,
            cargo_toml,
            package_json,
        };
        this.validate()?;

        Ok(this)
    }

    pub fn extract_backend(&mut self, path: impl AsRef<Path>) -> Result<(), anyhow::Error> {
        let filesystem = crate::cap::CapFilesystem::new(path.as_ref().to_path_buf())?;

        let mut i = 0;
        while let Ok(mut entry) = self.zip.by_index(i) {
            i += 1;

            if !entry.name().starts_with("backend/") {
                continue;
            }

            let clean_path = match entry.enclosed_name() {
                Some(clean_path) => clean_path,
                None => continue,
            };
            let clean_path = match clean_path.strip_prefix("backend/") {
                Ok(clean_path) => clean_path,
                Err(_) => continue,
            };

            if entry.is_dir() {
                filesystem.create_dir_all(clean_path)?;
            } else if entry.is_file() {
                let mut file = filesystem.create(clean_path)?;

                std::io::copy(&mut entry, &mut file)?;
                file.flush()?;
                file.sync_all()?;
            }
        }

        filesystem.write(
            "Metadata.toml",
            toml::to_string_pretty(&self.metadata_toml)?.into_bytes(),
        )?;

        Ok(())
    }

    pub fn extract_frontend(&mut self, path: impl AsRef<Path>) -> Result<(), anyhow::Error> {
        let filesystem = crate::cap::CapFilesystem::new(path.as_ref().to_path_buf())?;

        let mut i = 0;
        while let Ok(mut entry) = self.zip.by_index(i) {
            i += 1;

            if !entry.name().starts_with("frontend/") {
                continue;
            }

            let clean_path = match entry.enclosed_name() {
                Some(clean_path) => clean_path,
                None => continue,
            };
            let clean_path = match clean_path.strip_prefix("frontend/") {
                Ok(clean_path) => clean_path,
                Err(_) => continue,
            };

            if entry.is_dir() {
                filesystem.create_dir_all(clean_path)?;
            } else if entry.is_file() {
                let mut file = filesystem.create(clean_path)?;

                std::io::copy(&mut entry, &mut file)?;
                file.flush()?;
                file.sync_all()?;
            }
        }

        Ok(())
    }

    pub fn has_schema(&mut self) -> bool {
        self.zip.by_name("schema.ts").is_ok()
    }

    pub fn get_schema(&mut self) -> Result<String, anyhow::Error> {
        let mut schema_file = self.zip.by_name("schema.ts")?;
        let mut schema_string = String::new();
        schema_string.reserve_exact(schema_file.size() as usize);
        schema_file.read_to_string(&mut schema_string)?;

        Ok(schema_string)
    }

    pub fn validate(&mut self) -> Result<(), anyhow::Error> {
        const MUST_EXIST_DIRECTORIES: &[&str] =
            &["backend/", "backend/src/", "frontend/", "frontend/src/"];
        const MUST_EXIST_FILES: &[&str] = &[
            "Metadata.toml",
            "backend/Cargo.toml",
            "backend/src/lib.rs",
            "frontend/package.json",
            "frontend/src/index.ts",
        ];

        let mut package_segments = self.metadata_toml.package_name.split('.');
        let tld_segment = package_segments.next().ok_or_else(|| {
            anyhow::anyhow!("invalid package name in calagopus extension archive. (too few segments, expected 3)")
        })?;
        let author_segment = package_segments.next().ok_or_else(|| {
            anyhow::anyhow!("invalid package name in calagopus extension archive. (too few segments, expected 3)")
        })?;
        let identifier_segment = package_segments.next().ok_or_else(|| {
            anyhow::anyhow!("invalid package name in calagopus extension archive. (too few segments, expected 3)")
        })?;

        if package_segments.next().is_some() {
            return Err(anyhow::anyhow!(
                "invalid package name in calagopus extension archive. (too many segments, expected 3)"
            ));
        }

        if tld_segment.len() < 2 || tld_segment.len() > 6 {
            return Err(anyhow::anyhow!(
                "invalid tld segment `{}` in calagopus extension archive package name.",
                tld_segment
            ));
        }

        if author_segment.len() < 3 || author_segment.len() > 30 {
            return Err(anyhow::anyhow!(
                "invalid author segment `{}` in calagopus extension archive package name.",
                author_segment
            ));
        }

        if identifier_segment.len() < 5 || identifier_segment.len() > 30 {
            return Err(anyhow::anyhow!(
                "invalid identifier segment `{}` in calagopus extension archive package name.",
                identifier_segment
            ));
        }

        for c in tld_segment.chars() {
            if !c.is_ascii_lowercase() {
                return Err(anyhow::anyhow!(
                    "invalid character `{c}` in tld segment of calagopus extension archive package name."
                ));
            }
        }

        for c in author_segment.chars() {
            if !c.is_ascii_lowercase() && !c.is_ascii_digit() && c != '-' {
                return Err(anyhow::anyhow!(
                    "invalid character `{c}` in author segment of calagopus extension archive package name."
                ));
            }
        }

        for c in identifier_segment.chars() {
            if !c.is_ascii_lowercase() && !c.is_ascii_digit() && c != '-' {
                return Err(anyhow::anyhow!(
                    "invalid character `{c}` in identifier segment of calagopus extension archive package name."
                ));
            }
        }

        for dir in MUST_EXIST_DIRECTORIES {
            if self.zip.by_name(dir).ok().is_none_or(|e| !e.is_dir()) {
                return Err(anyhow::anyhow!(
                    "unable to find directory `{dir}` in calagopus extension archive."
                ));
            }
        }

        for file in MUST_EXIST_FILES {
            if self.zip.by_name(file).ok().is_none_or(|e| !e.is_file()) {
                return Err(anyhow::anyhow!(
                    "unable to find file `{file}` in calagopus extension archive."
                ));
            }
        }

        {
            let mut lib = self.zip.by_name("backend/src/lib.rs")?;
            let mut lib_string = String::new();
            lib_string.reserve_exact(lib.size() as usize);
            lib.read_to_string(&mut lib_string)?;
            drop(lib);

            if !lib_string.contains("pub struct ExtensionStruct") {
                return Err(anyhow::anyhow!(
                    "unable to find `pub struct ExtensionStruct` in calagopus extension archive backend/src/lib.rs."
                ));
            }
        }

        {
            let mut index = self.zip.by_name("frontend/src/index.ts")?;
            let mut index_string = String::new();
            index_string.reserve_exact(index.size() as usize);
            index.read_to_string(&mut index_string)?;
            drop(index);

            if !index_string.contains("export default new ") {
                return Err(anyhow::anyhow!(
                    "unable to find `export default new` in calagopus extension archive frontend/src/index.ts."
                ));
            }
        }

        if let Ok(schema_string) = self.get_schema()
            && !schema_string.contains("export default (definitions: DatabaseDefinitions) =>")
        {
            return Err(anyhow::anyhow!(
                "unable to find `export default (definitions: DatabaseDefinitions) =>` in calagopus extension archive schema.ts."
            ));
        }

        Ok(())
    }

    #[inline]
    pub fn total_size(&self) -> u128 {
        self.zip.decompressed_size().unwrap_or_default()
    }
}

pub struct SlimExtensionDistrFile {
    pub metadata_toml: MetadataToml,
    pub cargo_toml: CargoToml,
    pub package_json: PackageJson,
}

impl SlimExtensionDistrFile {
    pub fn parse_from_directory(path: impl AsRef<Path>) -> Result<Vec<Self>, anyhow::Error> {
        let filesystem = crate::cap::CapFilesystem::new(path.as_ref().to_path_buf())?;
        let mut results = Vec::new();

        let mut dir = filesystem.read_dir("backend-extensions")?;
        while let Some(Ok((is_dir, name))) = dir.next_entry() {
            if !is_dir || name == "internal-list" {
                continue;
            }

            let metadata_toml = filesystem.read_to_string(
                Path::new("backend-extensions")
                    .join(&name)
                    .join("Metadata.toml"),
            )?;
            let metadata_toml: MetadataToml = toml::from_str(&metadata_toml)?;

            let cargo_toml = filesystem.read_to_string(
                Path::new("backend-extensions")
                    .join(&name)
                    .join("Cargo.toml"),
            )?;
            let cargo_toml: CargoToml = toml::from_str(&cargo_toml)?;

            let package_json = filesystem.read_to_string(
                Path::new("frontend/extensions")
                    .join(&name)
                    .join("package.json"),
            )?;
            let package_json: PackageJson = serde_json::from_str(&package_json)?;

            results.push(Self {
                metadata_toml,
                cargo_toml,
                package_json,
            });
        }

        Ok(results)
    }
}

pub struct ExtensionDistrFileBuilder {
    zip: zip::ZipWriter<std::fs::File>,
    wrote_backend: bool,
    wrote_frontend: bool,
}

impl ExtensionDistrFileBuilder {
    pub fn new(file: std::fs::File) -> Self {
        Self {
            zip: zip::ZipWriter::new(file),
            wrote_backend: false,
            wrote_frontend: false,
        }
    }

    pub fn add_backend(mut self, path: impl AsRef<Path>) -> Result<Self, anyhow::Error> {
        if self.wrote_backend {
            return Err(anyhow::anyhow!(
                "Cannot write backend, it has already been written."
            ));
        }

        let filesystem = crate::cap::CapFilesystem::new(path.as_ref().to_path_buf())?;

        let metadata_toml = filesystem
            .read_to_string("Metadata.toml")
            .context("Failed to read Metadata.toml from backend extension directory.")?;
        self.zip
            .start_file("Metadata.toml", FileOptions::<()>::default())?;
        self.zip.write_all(metadata_toml.as_bytes())?;

        self.zip.add_directory(
            "backend",
            FileOptions::<()>::default().compression_level(Some(9)),
        )?;

        let ignored = &[GitignoreBuilder::new("/")
            .add_line(None, "Metadata.toml")?
            .build()?];

        let mut walker = filesystem.walk_dir(path)?.with_ignored(ignored);
        while let Some(Ok((_, name))) = walker.next_entry() {
            let metadata = filesystem.metadata(&name)?;
            let virtual_path = Path::new("backend").join(&name);

            let options: FileOptions<()> = FileOptions::default().compression_level(Some(9));

            if metadata.is_dir() {
                self.zip
                    .add_directory(virtual_path.to_string_lossy(), options)?;
            } else if metadata.is_file() {
                self.zip
                    .start_file(virtual_path.to_string_lossy(), options)?;

                let mut reader = filesystem.open(&name)?;
                std::io::copy(&mut reader, &mut self.zip)?;
            }
        }

        self.wrote_backend = true;

        Ok(self)
    }

    pub fn add_frontend(mut self, path: impl AsRef<Path>) -> Result<Self, anyhow::Error> {
        if self.wrote_frontend {
            return Err(anyhow::anyhow!(
                "Cannot write frontend, it has already been written."
            ));
        }

        let filesystem = crate::cap::CapFilesystem::new(path.as_ref().to_path_buf())?;

        self.zip.add_directory(
            "frontend",
            FileOptions::<()>::default().compression_level(Some(9)),
        )?;

        let ignored = &[GitignoreBuilder::new("/")
            .add_line(None, "node_modules/")?
            .build()?];

        let mut walker = filesystem.walk_dir(path)?.with_ignored(ignored);
        while let Some(Ok((_, name))) = walker.next_entry() {
            let metadata = filesystem.metadata(&name)?;
            let virtual_path = Path::new("frontend").join(&name);

            let options: FileOptions<()> = FileOptions::default().compression_level(Some(9));

            if metadata.is_dir() {
                self.zip
                    .add_directory(virtual_path.to_string_lossy(), options)?;
            } else if metadata.is_file() {
                self.zip
                    .start_file(virtual_path.to_string_lossy(), options)?;

                let mut reader = filesystem.open(&name)?;
                std::io::copy(&mut reader, &mut self.zip)?;
            }
        }

        self.wrote_frontend = true;

        Ok(self)
    }

    pub fn add_schema(mut self, schema: &str) -> Result<Self, anyhow::Error> {
        self.zip
            .start_file("schema.ts", FileOptions::<()>::default())?;
        self.zip.write_all(schema.as_bytes())?;

        Ok(self)
    }

    pub fn write(mut self) -> std::io::Result<std::fs::File> {
        if !self.wrote_backend {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Cannot finish writing extension archive: backend files not written.",
            ));
        }

        if !self.wrote_frontend {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Cannot finish writing extension archive: frontend files not written.",
            ));
        }

        self.zip.set_comment(format!(
            "this .c7s.zip extension archive has been generated by calagopus@{}",
            crate::VERSION
        ));
        let writer = self.zip.finish()?;

        Ok(writer)
    }
}
