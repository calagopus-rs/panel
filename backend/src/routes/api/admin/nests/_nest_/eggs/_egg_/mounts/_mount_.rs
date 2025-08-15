use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::nest_egg_mount::NestEggMount,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{
                GetAdminActivityLogger,
                nests::_nest_::{GetNest, eggs::_egg_::GetNestEgg},
            },
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
        nest: GetNest,
        egg: GetNestEgg,
        activity_logger: GetAdminActivityLogger,
        Path((_nest, _egg, mount)): Path<(i32, i32, i32)>,
    ) -> ApiResponseResult {
        let egg_mount =
            match NestEggMount::by_egg_id_mount_id(&state.database, egg.id, mount).await? {
                Some(mount) => mount,
                None => {
                    return ApiResponse::error("mount not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        NestEggMount::delete_by_ids(&state.database, egg.id, egg_mount.mount.id).await?;

        activity_logger
            .log(
                "nest:egg.mount.delete",
                serde_json::json!({
                    "nest_id": nest.id,
                    "egg_id": egg.id,
                    "mount_id": egg_mount.mount.id,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
