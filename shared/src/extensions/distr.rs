use ignore::gitignore::GitignoreBuilder;
use serde::Deserialize;
use std::{
    collections::BTreeMap,
    io::{Read, Write},
    path::Path,
};
use zip::write::FileOptions;

#[derive(Deserialize)]
struct CargoToml {
    package: CargoPackage,
}

#[derive(Deserialize)]
pub struct CargoPackage {
    pub name: String,
    pub description: Option<String>,
    pub authors: Option<Vec<String>>,
    pub version: String,
}

#[derive(Deserialize)]
pub struct NodePackage {
    pub dependencies: BTreeMap<String, String>,
}

pub struct ExtensionDistrFile {
    zip: zip::ZipArchive<std::fs::File>,

    pub identifier: String,
    pub backend_package: CargoPackage,
    pub frontend_package: NodePackage,
}

impl ExtensionDistrFile {
    pub fn parse_from_file(file: std::fs::File) -> Result<Self, anyhow::Error> {
        let mut zip = zip::ZipArchive::new(file)?;

        let mut identifier = zip.by_name("identifier.txt")?;
        let mut identifier_bytes = vec![0; identifier.size() as usize];
        identifier.read_exact(&mut identifier_bytes)?;
        drop(identifier);
        let identifier = String::from_utf8(identifier_bytes)?;

        let mut toml = zip.by_name("backend/Cargo.toml")?;
        let mut toml_bytes = vec![0; toml.size() as usize];
        toml.read_exact(&mut toml_bytes)?;
        drop(toml);

        let toml: CargoToml = toml::from_slice(&toml_bytes)?;

        let mut json = zip.by_name("frontend/package.json")?;
        let mut json_bytes = vec![0; json.size() as usize];
        json.read_exact(&mut json_bytes)?;
        drop(json);

        let frontend_package: NodePackage = serde_json::from_slice(&json_bytes)?;

        let mut this = Self {
            zip,
            identifier,
            backend_package: toml.package,
            frontend_package,
        };
        this.validate()?;

        Ok(this)
    }

    pub fn validate(&mut self) -> Result<(), anyhow::Error> {
        const MUST_EXIST_DIRECTORIES: &[&str] =
            &["backend/", "backend/src/", "frontend/", "frontend/src/"];
        const MUST_EXIST_FILES: &[&str] = &[
            "backend/Cargo.toml",
            "backend/src/lib.rs",
            "frontend/package.json",
            "frontend/src/index.ts",
        ];

        for c in self.identifier.chars() {
            if ('a'..'z').contains(&c) || c == '_' {
                break;
            }

            return Err(anyhow::anyhow!(
                "invalid character `{c}` in calagopus extension archive identifier."
            ));
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

        Ok(())
    }

    #[inline]
    pub fn total_size(&self) -> u128 {
        self.zip.decompressed_size().unwrap_or_default()
    }
}

pub struct ExtensionDistrFileBuilder {
    zip: zip::ZipWriter<std::fs::File>,
    wrote_backend: bool,
    wrote_frontend: bool,
}

impl ExtensionDistrFileBuilder {
    pub fn new(file: std::fs::File, identifier: &str) -> Result<Self, anyhow::Error> {
        let mut zip = zip::ZipWriter::new(file);

        zip.start_file("identifier.txt", FileOptions::<()>::default())?;
        zip.write_all(identifier.as_bytes())?;

        Ok(Self {
            zip,
            wrote_backend: false,
            wrote_frontend: false,
        })
    }

    pub fn add_backend(mut self, path: impl AsRef<Path>) -> Result<Self, anyhow::Error> {
        if self.wrote_backend {
            return Err(anyhow::anyhow!(
                "Cannot write backend, it has already been written."
            ));
        }

        let filesystem = crate::cap::CapFilesystem::new(path.as_ref().to_path_buf())?;

        self.zip.add_directory(
            "backend",
            FileOptions::<()>::default().compression_level(Some(9)),
        )?;

        let mut walker = filesystem.walk_dir(path)?;
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
