use colored::Colorize;
use std::sync::Arc;

pub struct S3 {
    pub public_url: String,
    pub bucket: Box<s3::Bucket>,
}

impl S3 {
    pub async fn new(env: Arc<crate::env::Env>) -> Self {
        let start = std::time::Instant::now();

        let mut instance = Self {
            public_url: env.s3_url.clone(),
            bucket: s3::Bucket::new(
                &env.s3_bucket,
                s3::Region::Custom {
                    region: env.s3_region.clone(),
                    endpoint: env.s3_endpoint.clone(),
                },
                s3::creds::Credentials::new(
                    Some(&env.s3_access_key),
                    Some(&env.s3_secret_key),
                    None,
                    None,
                    None,
                )
                .unwrap(),
            )
            .unwrap(),
        };

        if env.s3_path_style {
            instance.bucket.set_path_style();
        }

        crate::logger::log(
            crate::logger::LoggerLevel::Info,
            format!(
                "{} connected {}",
                "s3".bright_cyan(),
                format!(
                    "(s3@{}, {}ms)",
                    env.s3_region.bright_black(),
                    start.elapsed().as_millis()
                )
                .bright_black()
            ),
        );

        instance
    }

    #[inline]
    pub async fn url(&self, path: &str, content: &[u8], content_type: Option<&str>) -> String {
        self.bucket
            .put_object_with_content_type(
                path,
                content,
                content_type.unwrap_or("application/octet-stream"),
            )
            .await
            .unwrap();

        format!("{}/{}", self.public_url, path)
    }
}
