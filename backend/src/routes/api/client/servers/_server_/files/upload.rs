use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        jwt::BasePayload,
        routes::{
            ApiError, GetState,
            api::client::{GetUser, servers::_server_::GetServer},
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(format = "uri")]
        url: String,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        server: GetServer,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("files.create") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        #[derive(Serialize)]
        struct FileUploadJwt<'a> {
            #[serde(flatten)]
            base: BasePayload,

            server_uuid: uuid::Uuid,
            user_uuid: uuid::Uuid,
            unique_id: uuid::Uuid,

            ignored_files: &'a [String],
        }

        let token = server
            .node
            .create_jwt(
                &state.database,
                &state.jwt,
                &FileUploadJwt {
                    base: BasePayload {
                        issuer: "panel".into(),
                        subject: None,
                        audience: Vec::new(),
                        expiration_time: Some(chrono::Utc::now().timestamp() + 900),
                        not_before: None,
                        issued_at: Some(chrono::Utc::now().timestamp()),
                        jwt_id: user.id.to_string(),
                    },
                    server_uuid: server.uuid,
                    user_uuid: user.to_uuid(),
                    unique_id: uuid::Uuid::new_v4(),
                    ignored_files: server
                        .subuser_ignored_files
                        .as_deref()
                        .unwrap_or(&[]),
                },
            )
            .unwrap();

        let mut url = server.node.public_url();
        url.set_path("/upload/file");
        url.set_query(Some(&format!("token={}", urlencoding::encode(&token))));

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    url: url.to_string(),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
