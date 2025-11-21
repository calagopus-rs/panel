use shared::extensions::ConstructedExtension;

pub fn list() -> Vec<ConstructedExtension> {
    vec![
        ConstructedExtension {
            identifier: "test",
            name: "test",
            description: "sigma",
            authors: &["0x7d8", "Arnaud Ligma"],
            version: "1.0.0",
            extension: Box::new(test::ExtensionStruct::default()),
        },
    ]
}
