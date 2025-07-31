use colored::Colorize;
use sqlx::postgres::PgPoolOptions;

pub struct Database {
    write: sqlx::PgPool,
    read: Option<sqlx::PgPool>,

    encryption_key: String,
}

impl Database {
    pub async fn new(env: &crate::env::Env) -> Self {
        let start = std::time::Instant::now();

        let instance = Self {
            write: match &env.database_url_primary {
                Some(url) => PgPoolOptions::new()
                    .min_connections(10)
                    .max_connections(20)
                    .test_before_acquire(false)
                    .connect(url)
                    .await
                    .unwrap(),

                None => PgPoolOptions::new()
                    .min_connections(10)
                    .max_connections(20)
                    .test_before_acquire(false)
                    .connect(&env.database_url)
                    .await
                    .unwrap(),
            },
            read: if env.database_url_primary.is_some() {
                Some(
                    PgPoolOptions::new()
                        .min_connections(10)
                        .max_connections(20)
                        .test_before_acquire(false)
                        .connect(&env.database_url)
                        .await
                        .unwrap(),
                )
            } else {
                None
            },

            encryption_key: env.app_encryption_key.clone(),
        };

        let version: (String,) = sqlx::query_as("SELECT split_part(version(), ' ', 4)")
            .fetch_one(instance.read())
            .await
            .unwrap();

        tracing::info!(
            "{} connected {}",
            "database".bright_cyan(),
            format!(
                "(postgres@{}, {}ms)",
                version.0[..version.0.len() - 1].bright_black(),
                start.elapsed().as_millis()
            )
            .bright_black()
        );

        if env.database_migrate {
            let start = std::time::Instant::now();

            sqlx::migrate!("../database/migrations")
                .run(&instance.write)
                .await
                .unwrap();

            tracing::info!(
                "{} migrated {}",
                "database".bright_cyan(),
                format!("({}ms)", start.elapsed().as_millis()).bright_black()
            );
        }

        instance
    }

    pub async fn migrate(&self) -> Result<(), sqlx::Error> {
        let start = std::time::Instant::now();

        sqlx::migrate!("../database/migrations")
            .run(&self.write)
            .await?;

        tracing::info!(
            "{} migrated {}",
            "database".bright_cyan(),
            format!("({}ms)", start.elapsed().as_millis()).bright_black()
        );

        Ok(())
    }

    #[inline]
    pub fn write(&self) -> &sqlx::PgPool {
        &self.write
    }

    #[inline]
    pub fn read(&self) -> &sqlx::PgPool {
        self.read.as_ref().unwrap_or(&self.write)
    }

    #[inline]
    pub fn encrypt(&self, data: impl AsRef<[u8]>) -> Option<Vec<u8>> {
        simple_crypt::encrypt(data.as_ref(), self.encryption_key.as_bytes()).ok()
    }

    #[inline]
    pub fn decrypt(&self, data: impl AsRef<[u8]>) -> Option<String> {
        simple_crypt::decrypt(data.as_ref(), self.encryption_key.as_bytes())
            .map(|s| String::from_utf8_lossy(&s).to_string())
            .ok()
    }
}
