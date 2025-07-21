use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::nest_egg_mount::NestEggMount,
        routes::{
            ApiError, GetState,
            api::{admin::nests::_nest_::eggs::_egg_::GetNestEgg, client::GetUserActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "nest" = i32,
            description = "The nest ID",
            example = "1",
        ),
        (
            "egg" = i32,
            description = "The egg ID",
            example = "1",
        ),
        (
            "mount" = i32,
            description = "The mount ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        egg: GetNestEgg,
        activity_logger: GetUserActivityLogger,
        Path((_nest, _egg, mount)): Path<(i32, i32, i32)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let egg_mount = match NestEggMount::by_egg_id_mount_id(&state.database, egg.id, mount).await
        {
            Some(mount) => mount,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["mount not found"])),
                );
            }
        };

        NestEggMount::delete_by_ids(&state.database, egg.id, egg_mount.mount.id).await;

        activity_logger
            .log(
                "admin:egg.mount.delete",
                serde_json::json!({
                    "egg_id": egg.id,
                    "mount_id": egg_mount.mount.id,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
