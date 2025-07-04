// This file is auto-generated from OpenAPI spec. Do not edit manually.
use super::*;
use reqwest::{Client, Method, StatusCode};
use serde::de::DeserializeOwned;
use std::sync::LazyLock;

static CLIENT: LazyLock<Client> = LazyLock::new(|| {
    Client::builder()
        .user_agent("pterodactyl-rs panel")
        .build()
        .expect("Failed to create reqwest client")
});

type Algorithm = String;
type Game = String;

#[inline]
async fn request_impl<T: DeserializeOwned + 'static>(
    client: &WingsClient,
    method: Method,
    endpoint: String,
    body: Option<&serde_json::Value>,
) -> Result<T, (StatusCode, super::ApiError)> {
    let url = format!("{}{}", client.base_url.trim_end_matches('/'), endpoint);
    let mut request = CLIENT.request(method, &url);

    if !client.token.is_empty() {
        request = request.header("Authorization", format!("Bearer {}", client.token));
    }

    if let Some(body) = body {
        request = request.json(body);
    }

    match request.send().await {
        Ok(response) => {
            if response.status().is_success() {
                if std::any::type_name::<T>() == "alloc::string::String" {
                    return match response.text().await {
                        Ok(text) => Ok(*(Box::new(text) as Box<dyn std::any::Any>)
                            .downcast::<T>()
                            .unwrap()),
                        Err(err) => Err((
                            StatusCode::PRECONDITION_FAILED,
                            super::ApiError {
                                error: err.to_string(),
                            },
                        )),
                    };
                }

                match response.json().await {
                    Ok(data) => Ok(data),
                    Err(err) => Err((
                        StatusCode::PRECONDITION_FAILED,
                        super::ApiError {
                            error: err.to_string(),
                        },
                    )),
                }
            } else {
                Err((
                    response.status(),
                    response.json().await.unwrap_or_else(|err| super::ApiError {
                        error: err.to_string(),
                    }),
                ))
            }
        }
        Err(err) => Err((
            StatusCode::PRECONDITION_FAILED,
            super::ApiError {
                error: err.to_string(),
            },
        )),
    }
}

pub struct WingsClient {
    base_url: String,
    token: String,
}

impl WingsClient {
    #[inline]
    pub fn new(base_url: String, token: String) -> Self {
        Self { base_url, token }
    }

    pub async fn get_extensions(
        &self,
    ) -> Result<super::extensions::get::Response200, (StatusCode, super::ApiError)> {
        request_impl(self, Method::GET, format!("/api/extensions"), None).await
    }

    pub async fn get_servers(
        &self,
    ) -> Result<super::servers::get::Response200, (StatusCode, super::ApiError)> {
        request_impl(self, Method::GET, format!("/api/servers"), None).await
    }

    pub async fn post_servers(
        &self,
        data: &super::servers::post::RequestBody,
    ) -> Result<super::servers::post::Response200, (StatusCode, super::ApiError)> {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn get_servers_server(
        &self,
        server: uuid::Uuid,
    ) -> Result<super::servers_server::get::Response200, (StatusCode, super::ApiError)> {
        request_impl(self, Method::GET, format!("/api/servers/{server}"), None).await
    }

    pub async fn delete_servers_server(
        &self,
        server: uuid::Uuid,
    ) -> Result<super::servers_server::delete::Response200, (StatusCode, super::ApiError)> {
        request_impl(self, Method::DELETE, format!("/api/servers/{server}"), None).await
    }

    pub async fn post_servers_server_backup(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_backup::post::RequestBody,
    ) -> Result<super::servers_server_backup::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/backup"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn delete_servers_server_backup_backup(
        &self,
        server: uuid::Uuid,
        backup: uuid::Uuid,
    ) -> Result<
        super::servers_server_backup_backup::delete::Response200,
        (StatusCode, super::ApiError),
    > {
        request_impl(
            self,
            Method::DELETE,
            format!("/api/servers/{server}/backup/{backup}"),
            None,
        )
        .await
    }

    pub async fn post_servers_server_backup_backup_restore(
        &self,
        server: uuid::Uuid,
        backup: uuid::Uuid,
        data: &super::servers_server_backup_backup_restore::post::RequestBody,
    ) -> Result<
        super::servers_server_backup_backup_restore::post::Response200,
        (StatusCode, super::ApiError),
    > {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/backup/{backup}/restore"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_commands(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_commands::post::RequestBody,
    ) -> Result<super::servers_server_commands::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/commands"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_files_chmod(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_chmod::post::RequestBody,
    ) -> Result<super::servers_server_files_chmod::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/chmod"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_files_compress(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_compress::post::RequestBody,
    ) -> Result<
        super::servers_server_files_compress::post::Response200,
        (StatusCode, super::ApiError),
    > {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/compress"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn get_servers_server_files_contents(
        &self,
        server: uuid::Uuid,
        file: &str,
        download: bool,
        max_size: u64,
    ) -> Result<super::servers_server_files_contents::get::Response200, (StatusCode, super::ApiError)>
    {
        let file = urlencoding::encode(file);
        request_impl(self, Method::GET, format!("/api/servers/{server}/files/contents?file={file}&download={download}&max_size={max_size}"), None).await
    }

    pub async fn post_servers_server_files_copy(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_copy::post::RequestBody,
    ) -> Result<super::servers_server_files_copy::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/copy"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_files_create_directory(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_create_directory::post::RequestBody,
    ) -> Result<
        super::servers_server_files_create_directory::post::Response200,
        (StatusCode, super::ApiError),
    > {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/create-directory"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_files_decompress(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_decompress::post::RequestBody,
    ) -> Result<
        super::servers_server_files_decompress::post::Response200,
        (StatusCode, super::ApiError),
    > {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/decompress"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_files_delete(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_delete::post::RequestBody,
    ) -> Result<super::servers_server_files_delete::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/delete"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn get_servers_server_files_fingerprints(
        &self,
        server: uuid::Uuid,
        algorithm: Algorithm,
        files: &str,
    ) -> Result<
        super::servers_server_files_fingerprints::get::Response200,
        (StatusCode, super::ApiError),
    > {
        let files = urlencoding::encode(files);
        request_impl(
            self,
            Method::GET,
            format!("/api/servers/{server}/files/fingerprints?algorithm={algorithm}&files={files}"),
            None,
        )
        .await
    }

    pub async fn get_servers_server_files_list_directory(
        &self,
        server: uuid::Uuid,
        directory: &str,
        per_page: u64,
        page: u64,
    ) -> Result<
        super::servers_server_files_list_directory::get::Response200,
        (StatusCode, super::ApiError),
    > {
        let directory = urlencoding::encode(directory);
        request_impl(self, Method::GET, format!("/api/servers/{server}/files/list-directory?directory={directory}&per_page={per_page}&page={page}"), None).await
    }

    pub async fn get_servers_server_files_pull(
        &self,
        server: uuid::Uuid,
    ) -> Result<super::servers_server_files_pull::get::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::GET,
            format!("/api/servers/{server}/files/pull"),
            None,
        )
        .await
    }

    pub async fn post_servers_server_files_pull(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_pull::post::RequestBody,
    ) -> Result<super::servers_server_files_pull::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/pull"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn delete_servers_server_files_pull_pull(
        &self,
        server: uuid::Uuid,
        pull: uuid::Uuid,
    ) -> Result<
        super::servers_server_files_pull_pull::delete::Response200,
        (StatusCode, super::ApiError),
    > {
        request_impl(
            self,
            Method::DELETE,
            format!("/api/servers/{server}/files/pull/{pull}"),
            None,
        )
        .await
    }

    pub async fn put_servers_server_files_rename(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_rename::put::RequestBody,
    ) -> Result<super::servers_server_files_rename::put::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::PUT,
            format!("/api/servers/{server}/files/rename"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_files_search(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_search::post::RequestBody,
    ) -> Result<super::servers_server_files_search::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/search"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_files_write(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_files_write::post::RequestBody,
    ) -> Result<super::servers_server_files_write::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/files/write"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn get_servers_server_logs(
        &self,
        server: uuid::Uuid,
    ) -> Result<super::servers_server_logs::get::Response200, (StatusCode, super::ApiError)> {
        request_impl(
            self,
            Method::GET,
            format!("/api/servers/{server}/logs"),
            None,
        )
        .await
    }

    pub async fn post_servers_server_power(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_power::post::RequestBody,
    ) -> Result<super::servers_server_power::post::Response202, (StatusCode, super::ApiError)> {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/power"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn post_servers_server_reinstall(
        &self,
        server: uuid::Uuid,
    ) -> Result<super::servers_server_reinstall::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/reinstall"),
            None,
        )
        .await
    }

    pub async fn post_servers_server_sync(
        &self,
        server: uuid::Uuid,
    ) -> Result<super::servers_server_sync::post::Response200, (StatusCode, super::ApiError)> {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/sync"),
            None,
        )
        .await
    }

    pub async fn delete_servers_server_transfer(
        &self,
        server: uuid::Uuid,
    ) -> Result<super::servers_server_transfer::delete::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::DELETE,
            format!("/api/servers/{server}/transfer"),
            None,
        )
        .await
    }

    pub async fn post_servers_server_transfer(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_transfer::post::RequestBody,
    ) -> Result<super::servers_server_transfer::post::Response202, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/transfer"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn get_servers_server_version(
        &self,
        server: uuid::Uuid,
        game: Game,
    ) -> Result<super::servers_server_version::get::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::GET,
            format!("/api/servers/{server}/version?game={game}"),
            None,
        )
        .await
    }

    pub async fn post_servers_server_ws_deny(
        &self,
        server: uuid::Uuid,
        data: &super::servers_server_ws_deny::post::RequestBody,
    ) -> Result<super::servers_server_ws_deny::post::Response200, (StatusCode, super::ApiError)>
    {
        request_impl(
            self,
            Method::POST,
            format!("/api/servers/{server}/ws/deny"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }

    pub async fn get_stats(
        &self,
    ) -> Result<super::stats::get::Response200, (StatusCode, super::ApiError)> {
        request_impl(self, Method::GET, format!("/api/stats"), None).await
    }

    pub async fn get_system(
        &self,
    ) -> Result<super::system::get::Response200, (StatusCode, super::ApiError)> {
        request_impl(self, Method::GET, format!("/api/system"), None).await
    }

    pub async fn post_transfers(
        &self,
    ) -> Result<super::transfers::post::Response200, (StatusCode, super::ApiError)> {
        request_impl(self, Method::POST, format!("/api/transfers"), None).await
    }

    pub async fn delete_transfers_server(
        &self,
        server: uuid::Uuid,
    ) -> Result<super::transfers_server::delete::Response200, (StatusCode, super::ApiError)> {
        request_impl(
            self,
            Method::DELETE,
            format!("/api/transfers/{server}"),
            None,
        )
        .await
    }

    pub async fn post_update(
        &self,
        data: &super::update::post::RequestBody,
    ) -> Result<super::update::post::Response200, (StatusCode, super::ApiError)> {
        request_impl(
            self,
            Method::POST,
            format!("/api/update"),
            serde_json::to_value(data).ok().as_ref(),
        )
        .await
    }
}
