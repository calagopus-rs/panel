use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::{body::Bytes, http::StatusCode};
    use image::{ImageReader, codecs::webp::WebPEncoder, imageops::FilterType};
    use rand::distr::SampleString;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), request_body = String)]
    pub async fn route(state: GetState, user: GetUser, image: Bytes) -> ApiResponseResult {
        let image = match ImageReader::new(std::io::Cursor::new(image)).with_guessed_format() {
            Ok(reader) => reader,
            Err(_) => {
                return ApiResponse::error("image: unable to decode")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        };

        let image = match image.decode() {
            Ok(image) => image,
            Err(_) => {
                return ApiResponse::error("image: unable to decode")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        };

        let data = tokio::task::spawn_blocking(move || -> Result<Vec<u8>, image::ImageError> {
            let image = image.resize_exact(512, 512, FilterType::Triangle);
            let mut data: Vec<u8> = Vec::new();
            let encoder = WebPEncoder::new_lossless(&mut data);
            let color = image.color();
            encoder.encode(image.as_bytes(), 512, 512, color.into())?;

            Ok(data)
        })
        .await??;

        let identifier_random = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 8);
        let avatar_path = format!("avatars/{}/{}.webp", user.uuid, identifier_random);

        tokio::try_join!(
            state.storage.store(&avatar_path, &data, "image/webp"),
            state.storage.remove(user.avatar.as_deref().unwrap_or("")),
        )?;

        sqlx::query!(
            "UPDATE users
            SET avatar = $2
            WHERE users.uuid = $1",
            user.uuid,
            avatar_path
        )
        .execute(state.database.write())
        .await?;

        ApiResponse::json(Response {}).ok()
    }
}

mod delete {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ))]
    pub async fn route(state: GetState, user: GetUser) -> ApiResponseResult {
        let avatar = match &user.avatar {
            Some(avatar) => avatar,
            None => {
                return ApiResponse::error("no avatar to delete")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        };

        state.storage.remove(avatar).await?;

        sqlx::query!(
            "UPDATE users
            SET avatar = NULL
            WHERE users.uuid = $1",
            user.uuid
        )
        .execute(state.database.write())
        .await?;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(put::route))
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
