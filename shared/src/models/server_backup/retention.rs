use super::{DeleteServerBackupOptions, EvictionScope, ServerBackup, ServerBackupKind};
use crate::prelude::*;
use chrono::Datelike;
use garde::Validate;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::collections::{HashMap, HashSet};
use utoipa::ToSchema;

#[derive(Debug, ToSchema, Validate, Serialize, Deserialize, Default, Clone, PartialEq, Eq)]
#[serde(default)]
pub struct BackupRetention {
    #[garde(range(max = 2147483647))]
    #[schema(minimum = 0, maximum = 2147483647)]
    pub count: u32,
    #[garde(range(max = 2147483647))]
    #[schema(minimum = 0, maximum = 2147483647)]
    pub days: u32,
    #[garde(range(max = 2147483647))]
    #[schema(minimum = 0, maximum = 2147483647)]
    pub daily: u32,
    #[garde(range(max = 2147483647))]
    #[schema(minimum = 0, maximum = 2147483647)]
    pub weekly: u32,
    #[garde(range(max = 2147483647))]
    #[schema(minimum = 0, maximum = 2147483647)]
    pub monthly: u32,
    #[garde(range(max = 2147483647))]
    #[schema(minimum = 0, maximum = 2147483647)]
    pub yearly: u32,
}

impl BackupRetention {
    #[inline]
    pub fn is_disabled(&self) -> bool {
        self.count == 0
            && self.days == 0
            && self.daily == 0
            && self.weekly == 0
            && self.monthly == 0
            && self.yearly == 0
    }

    fn retained_backups(
        &self,
        backups: impl Iterator<Item = (uuid::Uuid, chrono::NaiveDateTime)>,
        now: chrono::NaiveDateTime,
    ) -> HashSet<uuid::Uuid> {
        let mut backups: Vec<_> = backups.collect();
        backups.sort_unstable_by(|a, b| b.1.cmp(&a.1).then_with(|| b.0.cmp(&a.0)));

        let mut retained = HashSet::new();
        let mut days = HashSet::new();
        let mut weeks = HashSet::new();
        let mut months = HashSet::new();
        let mut years = HashSet::new();

        for (index, (uuid, created)) in backups.into_iter().enumerate() {
            let week = created.iso_week();
            let daily = days.len() < self.daily as usize && days.insert(created.date());
            let weekly =
                weeks.len() < self.weekly as usize && weeks.insert((week.year(), week.week()));
            let monthly = months.len() < self.monthly as usize
                && months.insert((created.year(), created.month()));
            let yearly = years.len() < self.yearly as usize && years.insert(created.year());

            let recent = self.days > 0
                && now.signed_duration_since(created) <= chrono::Duration::days(self.days as i64);

            if self.is_disabled()
                || index < self.count as usize
                || recent
                || daily
                || weekly
                || monthly
                || yearly
            {
                retained.insert(uuid);
            }
        }

        retained
    }
}

#[derive(Clone)]
pub struct RetentionDeletionGuard {
    pub backup_group_uuid: Option<uuid::Uuid>,
    pub system_backup_policy_uuid: Option<uuid::Uuid>,
    pub successful: bool,
    pub completed: chrono::NaiveDateTime,
    pub retention: BackupRetention,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EvictionMode {
    /// Only free slots retention already considers expendable, so an interactive create never
    /// destroys a backup the server's rules still keep.
    Expendable,
    /// Fall back to evicting a single unmanaged or still-retained backup of the same kind, so
    /// unattended schedules keep running once a server settles on its backup limit.
    Any,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum EvictionTier {
    ExpiredFailed,
    OverRetention,
    RecentFailed,
    Ungrouped,
    Retained,
}

impl EvictionTier {
    #[inline]
    fn is_expendable(self) -> bool {
        matches!(self, Self::ExpiredFailed | Self::OverRetention)
    }

    #[inline]
    fn rule(self) -> &'static str {
        match self {
            Self::ExpiredFailed | Self::RecentFailed => "failed",
            Self::OverRetention => "retention",
            Self::Ungrouped => "ungrouped",
            Self::Retained => "in-retention",
        }
    }
}

fn database_source(backup: &ServerBackup) -> Option<uuid::Uuid> {
    if backup.kind == ServerBackupKind::Server {
        return None;
    }

    Some(backup.database_instance_uuid.unwrap_or_else(|| {
        backup.metadata["source_instance"]["uuid"]
            .as_str()
            .and_then(|uuid| uuid.parse().ok())
            .unwrap_or(backup.uuid)
    }))
}

fn deletion_candidates<'a>(
    backups: impl IntoIterator<Item = &'a ServerBackup>,
    retention: &BackupRetention,
    now: chrono::NaiveDateTime,
) -> HashSet<uuid::Uuid> {
    let mut scopes: HashMap<_, Vec<&ServerBackup>> = HashMap::new();
    let mut candidates = HashSet::new();

    for backup in backups {
        if backup.deleted.is_some() || backup.deleting.is_some() {
            continue;
        }

        let Some(completed) = backup.completed else {
            continue;
        };

        if !backup.successful {
            if !backup.locked && completed <= now - chrono::Duration::hours(24) {
                candidates.insert(backup.uuid);
            }

            continue;
        }

        let source = database_source(backup);
        scopes
            .entry((backup.kind, source))
            .or_default()
            .push(backup);
    }

    for scope in scopes.values() {
        let retained = retention.retained_backups(
            scope.iter().map(|backup| (backup.uuid, backup.created)),
            now,
        );

        for backup in scope {
            if !backup.locked && !retained.contains(&backup.uuid) {
                candidates.insert(backup.uuid);
            }
        }
    }

    candidates
}

/// Ranks a server's backups by how expendable they are for a create of `kind`. Backups retention
/// has already condemned are offered whatever their kind, since deleting them is due anyway, but
/// the last-resort tiers are restricted to `kind` so a server backup never sacrifices a database
/// one to make room.
fn eviction_order<'a>(
    backups: &'a [ServerBackup],
    group_retentions: &HashMap<uuid::Uuid, BackupRetention>,
    kind: ServerBackupKind,
    now: chrono::NaiveDateTime,
) -> Vec<(EvictionTier, &'a ServerBackup)> {
    let mut scopes: HashMap<Option<uuid::Uuid>, Vec<&ServerBackup>> = HashMap::new();
    for backup in backups {
        scopes
            .entry(backup.backup_group_uuid)
            .or_default()
            .push(backup);
    }

    let unmanaged = BackupRetention::default();

    let mut ranked = Vec::new();
    for (group_uuid, scope) in scopes {
        let retention = group_uuid
            .and_then(|uuid| group_retentions.get(&uuid))
            .unwrap_or(&unmanaged);
        let candidates = deletion_candidates(scope.iter().copied(), retention, now);

        for backup in scope {
            if backup.locked {
                continue;
            }

            let tier = match (
                backup.successful,
                candidates.contains(&backup.uuid),
                group_uuid.is_some(),
            ) {
                (false, true, _) => EvictionTier::ExpiredFailed,
                (true, true, _) => EvictionTier::OverRetention,
                (false, false, _) => EvictionTier::RecentFailed,
                (true, false, false) => EvictionTier::Ungrouped,
                (true, false, true) => EvictionTier::Retained,
            };

            if !tier.is_expendable() && backup.kind != kind {
                continue;
            }

            ranked.push((tier, backup));
        }
    }

    ranked.sort_unstable_by(|a, b| {
        a.0.cmp(&b.0)
            .then_with(|| a.1.created.cmp(&b.1.created))
            .then_with(|| a.1.uuid.cmp(&b.1.uuid))
    });

    ranked
}

impl ServerBackup {
    pub async fn prune_retention_for_backup(
        state: &crate::State,
        backup_uuid: uuid::Uuid,
    ) -> Result<u64, anyhow::Error> {
        let scope: Option<(Option<uuid::Uuid>, Option<uuid::Uuid>, Option<uuid::Uuid>)> =
            sqlx::query_as(
                r#"
                SELECT
                    server_backups.server_uuid,
                    server_backups.backup_group_uuid,
                    server_backups.system_backup_policy_uuid
                FROM server_backups
                WHERE server_backups.uuid = $1
                AND server_backups.deleted IS NULL
                "#,
            )
            .bind(backup_uuid)
            .fetch_optional(state.database.write())
            .await?;

        let Some((server_uuid, group_uuid, policy_uuid)) = scope else {
            return Ok(0);
        };

        Self::prune_retention_scope(state, server_uuid, group_uuid, policy_uuid).await
    }

    async fn prune_retention_scope(
        state: &crate::State,
        server_uuid: Option<uuid::Uuid>,
        group_uuid: Option<uuid::Uuid>,
        policy_uuid: Option<uuid::Uuid>,
    ) -> Result<u64, anyhow::Error> {
        let (table, scope_column, empty_column, scope_uuid) = match (group_uuid, policy_uuid) {
            (Some(uuid), None) => (
                "server_backup_groups",
                "backup_group_uuid",
                "system_backup_policy_uuid",
                uuid,
            ),
            (None, Some(uuid)) => (
                "system_backup_policies",
                "system_backup_policy_uuid",
                "backup_group_uuid",
                uuid,
            ),
            _ => return Ok(0),
        };

        let mut transaction = state.database.write().begin().await?;

        let config = sqlx::query(sqlx::AssertSqlSafe(format!(
            r#"
            SELECT {table}.name, {table}.retention
            FROM {table}
            WHERE {table}.uuid = $1
            FOR SHARE
            "#
        )))
        .bind(scope_uuid)
        .fetch_optional(&mut *transaction)
        .await?;

        let Some(config) = config else {
            return Ok(0);
        };

        let name: compact_str::CompactString = config.try_get("name")?;
        let retention: BackupRetention = serde_json::from_value(config.try_get("retention")?)?;
        retention.validate()?;

        let rows = sqlx::query(sqlx::AssertSqlSafe(format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.{scope_column} = $1
            AND server_backups.{empty_column} IS NULL
            AND server_backups.server_uuid IS NOT DISTINCT FROM $2
            AND server_backups.deleted IS NULL
            AND server_backups.deleting IS NULL
            AND server_backups.completed IS NOT NULL
            ORDER BY server_backups.uuid
            FOR UPDATE
            "#,
            Self::columns_sql(None)
        )))
        .bind(scope_uuid)
        .bind(server_uuid)
        .fetch_all(&mut *transaction)
        .await?;

        let backups = rows
            .iter()
            .map(|row| Self::map(None, row))
            .try_collect_vec()?;

        let candidates = deletion_candidates(&backups, &retention, chrono::Utc::now().naive_utc());

        let mut claimed = Vec::new();
        for backup in backups {
            if !candidates.contains(&backup.uuid) || (server_uuid.is_none() && backup.successful) {
                continue;
            }

            let Some(completed) = backup.completed else {
                continue;
            };

            if backup.backup_configuration_in_maintenance(state).await? {
                continue;
            }

            let options = DeleteServerBackupOptions {
                retention: Some(RetentionDeletionGuard {
                    backup_group_uuid: group_uuid,
                    system_backup_policy_uuid: policy_uuid,
                    successful: backup.successful,
                    completed,
                    retention: retention.clone(),
                }),
                ..Default::default()
            };
            backup
                .claim_deletion(state, &options, &mut transaction)
                .await?;

            claimed.push((backup, options));
        }

        transaction.commit().await?;

        let mut pruned = 0;
        for (backup, options) in claimed {
            if let Err(err) = backup.dispatch_claimed_deletion(state, &options).await {
                tracing::error!(backup = %backup.uuid, "failed to prune backup: {err:#?}");
                continue;
            }

            if let Some(server_uuid) = server_uuid {
                Self::log_eviction_activity(
                    state,
                    server_uuid,
                    &backup,
                    if backup.successful {
                        "retention"
                    } else {
                        "failed"
                    },
                    if group_uuid.is_some() {
                        EvictionScope::Group(name.as_str())
                    } else {
                        EvictionScope::Policy(name.as_str())
                    },
                )
                .await;
            }

            pruned += 1;
        }

        Ok(pruned)
    }

    pub async fn prune_ungrouped_backups(state: &crate::State) -> Result<u64, anyhow::Error> {
        let servers: Vec<Option<uuid::Uuid>> = sqlx::query_scalar(
            r#"
            SELECT DISTINCT server_backups.server_uuid
            FROM server_backups
            WHERE server_backups.backup_group_uuid IS NULL
            AND server_backups.system_backup_policy_uuid IS NULL
            AND server_backups.deleted IS NULL
            AND server_backups.deleting IS NULL
            AND server_backups.completed IS NOT NULL
            AND NOT server_backups.successful
            "#,
        )
        .fetch_all(state.database.write())
        .await?;

        let mut pruned = 0;
        for server_uuid in servers {
            match Self::prune_ungrouped_scope(state, server_uuid).await {
                Ok(count) => pruned += count,
                Err(err) => {
                    tracing::error!(server = ?server_uuid, "failed to prune ungrouped backups: {err:#?}");
                }
            }
        }

        Ok(pruned)
    }

    async fn prune_ungrouped_scope(
        state: &crate::State,
        server_uuid: Option<uuid::Uuid>,
    ) -> Result<u64, anyhow::Error> {
        let mut transaction = state.database.write().begin().await?;

        let rows = sqlx::query(sqlx::AssertSqlSafe(format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.server_uuid IS NOT DISTINCT FROM $1
            AND server_backups.backup_group_uuid IS NULL
            AND server_backups.system_backup_policy_uuid IS NULL
            AND server_backups.deleted IS NULL
            AND server_backups.deleting IS NULL
            AND server_backups.completed IS NOT NULL
            AND NOT server_backups.successful
            ORDER BY server_backups.uuid
            FOR UPDATE
            "#,
            Self::columns_sql(None)
        )))
        .bind(server_uuid)
        .fetch_all(&mut *transaction)
        .await?;

        let backups = rows
            .iter()
            .map(|row| Self::map(None, row))
            .try_collect_vec()?;

        let candidates = deletion_candidates(
            &backups,
            &BackupRetention::default(),
            chrono::Utc::now().naive_utc(),
        );

        let options = DeleteServerBackupOptions::default();

        let mut claimed = Vec::new();
        for backup in backups {
            if !candidates.contains(&backup.uuid) {
                continue;
            }

            if backup.backup_configuration_in_maintenance(state).await? {
                continue;
            }

            backup
                .claim_deletion(state, &options, &mut transaction)
                .await?;

            claimed.push(backup);
        }

        transaction.commit().await?;

        let mut pruned = 0;
        for backup in claimed {
            if let Err(err) = backup.dispatch_claimed_deletion(state, &options).await {
                tracing::error!(backup = %backup.uuid, "failed to prune ungrouped backup: {err:#?}");
                continue;
            }

            if let Some(server_uuid) = server_uuid {
                Self::log_eviction_activity(
                    state,
                    server_uuid,
                    &backup,
                    "failed",
                    EvictionScope::Server,
                )
                .await;
            }

            pruned += 1;
        }

        Ok(pruned)
    }

    /// Frees a slot for a server that has reached its `backup_limit` by making room for a backup
    /// of `kind`, returning how many deletions were successfully dispatched. Node deletions
    /// complete asynchronously, so the caller must subtract this from its own count rather than
    /// counting again.
    pub async fn evict_for_create(
        state: &crate::State,
        server_uuid: uuid::Uuid,
        kind: ServerBackupKind,
        mode: EvictionMode,
    ) -> Result<u64, anyhow::Error> {
        let mut transaction = state.database.write().begin().await?;

        let group_rows = sqlx::query(
            r#"
            SELECT
                server_backup_groups.uuid,
                server_backup_groups.name,
                server_backup_groups.retention
            FROM server_backup_groups
            WHERE server_backup_groups.server_uuid = $1
            FOR SHARE
            "#,
        )
        .bind(server_uuid)
        .fetch_all(&mut *transaction)
        .await?;

        let mut group_names = HashMap::new();
        let mut group_retentions = HashMap::new();
        for row in group_rows {
            let uuid: uuid::Uuid = row.try_get("uuid")?;
            let name: compact_str::CompactString = row.try_get("name")?;
            let retention: BackupRetention = serde_json::from_value(row.try_get("retention")?)?;
            retention.validate()?;

            group_names.insert(uuid, name);
            group_retentions.insert(uuid, retention);
        }

        let rows = sqlx::query(sqlx::AssertSqlSafe(format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.server_uuid = $1
            AND server_backups.system_backup_policy_uuid IS NULL
            AND server_backups.deleted IS NULL
            AND server_backups.deleting IS NULL
            AND server_backups.completed IS NOT NULL
            ORDER BY server_backups.uuid
            FOR UPDATE
            "#,
            Self::columns_sql(None)
        )))
        .bind(server_uuid)
        .fetch_all(&mut *transaction)
        .await?;

        let backups = rows
            .iter()
            .map(|row| Self::map(None, row))
            .try_collect_vec()?;
        let ranked = eviction_order(
            &backups,
            &group_retentions,
            kind,
            chrono::Utc::now().naive_utc(),
        );

        let options = DeleteServerBackupOptions::default();

        let mut claimed = Vec::new();
        for (tier, backup) in ranked {
            if !tier.is_expendable() && (mode == EvictionMode::Expendable || !claimed.is_empty()) {
                break;
            }

            if backup.backup_configuration_in_maintenance(state).await? {
                continue;
            }

            if tier == EvictionTier::Retained {
                tracing::warn!(
                    server = %server_uuid,
                    backup = %backup.uuid,
                    "evicting a retained backup to satisfy backup_limit; retention quota exceeds backup_limit"
                );
            }

            backup
                .claim_deletion(state, &options, &mut transaction)
                .await?;

            claimed.push((tier, backup));
        }

        if mode == EvictionMode::Any && claimed.is_empty() {
            tracing::warn!(
                server = %server_uuid,
                kind = ?kind,
                "no backup could be evicted to satisfy backup_limit; every candidate is locked or belongs to another kind"
            );
        }

        transaction.commit().await?;

        let mut evicted = 0;
        for (tier, backup) in claimed {
            if let Err(err) = backup.dispatch_claimed_deletion(state, &options).await {
                tracing::error!(backup = %backup.uuid, "failed to evict backup: {err:#?}");
                continue;
            }

            Self::log_eviction_activity(
                state,
                server_uuid,
                backup,
                tier.rule(),
                match backup
                    .backup_group_uuid
                    .and_then(|uuid| group_names.get(&uuid))
                {
                    Some(name) => EvictionScope::Group(name.as_str()),
                    None => EvictionScope::Server,
                },
            )
            .await;

            evicted += 1;
        }

        Ok(evicted)
    }

    pub async fn prune_group_backups(state: &crate::State) -> Result<u64, anyhow::Error> {
        let scopes: Vec<(uuid::Uuid, Option<uuid::Uuid>)> = sqlx::query_as(
            r#"
            SELECT DISTINCT server_backups.backup_group_uuid, server_backups.server_uuid
            FROM server_backups
            WHERE server_backups.backup_group_uuid IS NOT NULL
            AND server_backups.deleted IS NULL
            AND server_backups.deleting IS NULL
            "#,
        )
        .fetch_all(state.database.write())
        .await?;

        let mut pruned = 0;
        for (uuid, server_uuid) in scopes {
            match Self::prune_retention_scope(state, server_uuid, Some(uuid), None).await {
                Ok(count) => pruned += count,
                Err(err) => {
                    tracing::error!(group = %uuid, "failed to prune backup group: {err:#?}");
                }
            }
        }

        Ok(pruned)
    }

    pub async fn prune_system_backups(state: &crate::State) -> Result<u64, anyhow::Error> {
        let scopes: Vec<(uuid::Uuid, Option<uuid::Uuid>)> = sqlx::query_as(
            r#"
            SELECT DISTINCT server_backups.system_backup_policy_uuid, server_backups.server_uuid
            FROM server_backups
            WHERE server_backups.system_backup_policy_uuid IS NOT NULL
            AND server_backups.deleted IS NULL
            AND server_backups.deleting IS NULL
            "#,
        )
        .fetch_all(state.database.write())
        .await?;

        let mut pruned = 0;
        for (uuid, server_uuid) in scopes {
            match Self::prune_retention_scope(state, server_uuid, None, Some(uuid)).await {
                Ok(count) => pruned += count,
                Err(err) => {
                    tracing::error!(policy = %uuid, "failed to prune system backups: {err:#?}");
                }
            }
        }

        Ok(pruned)
    }
}

#[cfg(test)]
mod tests {
    use super::{
        BackupRetention, EvictionTier, ServerBackup, ServerBackupKind, deletion_candidates,
        eviction_order,
    };
    use crate::models::{
        ByUuid,
        node::Node,
        server_backup::BackupDisk,
        server_backup_group::{CreateServerBackupGroupOptions, UpdateServerBackupGroupOptions},
        system_backup_policy::{CreateSystemBackupPolicyOptions, UpdateSystemBackupPolicyOptions},
    };
    use garde::Validate;
    use std::collections::HashSet;

    fn date(value: &str) -> chrono::NaiveDateTime {
        chrono::NaiveDateTime::parse_from_str(value, "%Y-%m-%d %H:%M:%S").unwrap()
    }

    fn ids(values: &[u128]) -> HashSet<uuid::Uuid> {
        values.iter().copied().map(uuid::Uuid::from_u128).collect()
    }

    fn retained(
        retention: BackupRetention,
        backups: &[(u128, &str)],
        now: &str,
    ) -> HashSet<uuid::Uuid> {
        retention.retained_backups(
            backups
                .iter()
                .map(|(id, created)| (uuid::Uuid::from_u128(*id), date(created))),
            date(now),
        )
    }

    fn backup(id: u128, created: &str) -> ServerBackup {
        let created = date(created);
        ServerBackup {
            uuid: uuid::Uuid::from_u128(id),
            server: None,
            node: Node::get_fetchable(uuid::Uuid::nil()),
            backup_configuration: None,
            backup_group_uuid: None,
            system_backup_policy_uuid: None,
            database_instance_uuid: None,
            kind: ServerBackupKind::Server,
            database_type: None,
            name: "test".into(),
            successful: true,
            browsable: false,
            streaming: false,
            locked: false,
            shared: false,
            ignored_files: Vec::new(),
            checksum: None,
            bytes: 0,
            files: 0,
            disk: BackupDisk::Local,
            upload_id: None,
            upload_path: None,
            metadata: serde_json::json!({}),
            completed: Some(created + chrono::Duration::minutes(1)),
            deleting: None,
            deletion_retries: 0,
            deleted: None,
            created,
            extension_data: Vec::new(),
        }
    }

    #[test]
    fn overlapping_calendar_rules_choose_newest_backup_in_each_occupied_period() {
        let backups = [
            (1, "2026-09-07 08:00:00"),
            (2, "2026-09-07 20:00:00"),
            (3, "2026-09-06 09:00:00"),
            (4, "2026-09-06 21:00:00"),
            (5, "2026-08-30 12:00:00"),
            (6, "2026-07-31 12:00:00"),
            (7, "2025-12-31 12:00:00"),
            (8, "2025-01-01 12:00:00"),
        ];
        assert_eq!(
            retained(
                BackupRetention {
                    daily: 2,
                    weekly: 2,
                    monthly: 2,
                    yearly: 2,
                    ..Default::default()
                },
                &backups,
                "2026-09-08 00:00:00",
            ),
            ids(&[2, 4, 5, 7]),
        );
    }

    #[test]
    fn missed_days_do_not_consume_daily_retention_slots() {
        assert_eq!(
            retained(
                BackupRetention {
                    daily: 3,
                    ..Default::default()
                },
                &[
                    (1, "2026-09-07 12:00:00"),
                    (2, "2026-08-20 12:00:00"),
                    (3, "2026-05-01 12:00:00"),
                    (4, "2026-04-30 12:00:00"),
                ],
                "2026-09-08 00:00:00",
            ),
            ids(&[1, 2, 3]),
        );
    }

    #[test]
    fn weekly_retention_uses_monday_and_iso_week_year() {
        assert_eq!(
            retained(
                BackupRetention {
                    weekly: 2,
                    ..Default::default()
                },
                &[
                    (1, "2021-01-04 00:00:00"),
                    (2, "2021-01-03 23:59:59"),
                    (3, "2020-12-31 23:59:59"),
                    (4, "2020-12-28 00:00:00"),
                    (5, "2020-12-27 23:59:59"),
                ],
                "2021-01-05 00:00:00",
            ),
            ids(&[1, 2]),
        );
    }

    #[test]
    fn monthly_and_yearly_retention_handle_leap_day_and_year_boundaries() {
        let backups = [
            (1, "2024-03-01 00:00:00"),
            (2, "2024-02-29 23:59:59"),
            (3, "2024-02-28 23:59:59"),
            (4, "2024-01-01 00:00:00"),
            (5, "2023-12-31 23:59:59"),
            (6, "2023-03-01 00:00:00"),
            (7, "2022-12-31 23:59:59"),
        ];
        assert_eq!(
            retained(
                BackupRetention {
                    monthly: 2,
                    yearly: 2,
                    ..Default::default()
                },
                &backups,
                "2024-03-02 00:00:00",
            ),
            ids(&[1, 2, 5]),
        );
    }

    #[test]
    fn count_days_and_calendar_rules_form_a_union() {
        assert_eq!(
            retained(
                BackupRetention {
                    count: 2,
                    days: 1,
                    monthly: 2,
                    ..Default::default()
                },
                &[
                    (1, "2026-09-07 11:00:00"),
                    (2, "2026-09-07 10:00:00"),
                    (3, "2026-09-06 12:00:00"),
                    (4, "2026-09-06 11:59:59"),
                    (5, "2026-08-31 23:59:59"),
                    (6, "2026-08-31 12:00:00"),
                ],
                "2026-09-07 12:00:00",
            ),
            ids(&[1, 2, 3, 5]),
        );
        assert_eq!(
            retained(
                BackupRetention {
                    count: 2,
                    days: 1,
                    ..Default::default()
                },
                &[
                    (1, "2026-09-07 11:00:00"),
                    (2, "2026-09-01 00:00:00"),
                    (3, "2026-08-01 00:00:00")
                ],
                "2026-09-07 12:00:00",
            ),
            ids(&[1, 2]),
        );
    }

    #[test]
    fn equal_timestamps_have_deterministic_selection() {
        let retention = BackupRetention {
            count: 1,
            ..Default::default()
        };
        let backups = [(1, "2026-09-07 12:00:00"), (2, "2026-09-07 12:00:00")];
        assert_eq!(
            retained(retention.clone(), &backups, "2026-09-08 00:00:00"),
            ids(&[2])
        );
        assert_eq!(
            retained(retention, &[backups[1], backups[0]], "2026-09-08 00:00:00"),
            ids(&[2])
        );
    }

    #[test]
    fn disabled_retention_preserves_all_successful_backups() {
        let retention = BackupRetention::default();
        assert!(retention.is_disabled());
        assert!(retention.validate().is_ok());
        assert_eq!(
            retained(
                retention,
                &[(1, "2000-01-01 00:00:00"), (2, "2026-09-07 00:00:00")],
                "2026-09-08 00:00:00"
            ),
            ids(&[1, 2]),
        );
    }

    #[test]
    fn failed_cleanup_uses_completion_time_and_protects_active_or_locked_backups() {
        let now = date("2026-09-07 12:00:00");
        let mut backups: Vec<_> = (1..=7)
            .map(|id| backup(id, "2026-08-01 00:00:00"))
            .collect();
        for backup in &mut backups {
            backup.successful = false;
            backup.completed = Some(now - chrono::Duration::hours(24));
        }
        backups[1].completed =
            Some(now - chrono::Duration::hours(24) + chrono::Duration::seconds(1));
        backups[2].locked = true;
        backups[3].completed = None;
        backups[4].deleting = Some(now);
        backups[5].deleted = Some(now);
        backups[6].completed = Some(now - chrono::Duration::days(2));
        assert_eq!(
            deletion_candidates(
                &backups,
                &BackupRetention {
                    count: 1,
                    ..Default::default()
                },
                now
            ),
            ids(&[1, 7])
        );
    }

    #[test]
    fn protected_successful_backups_are_never_deleted_or_replaced_by_inflight_records() {
        let now = date("2026-09-07 12:00:00");
        let mut backups = vec![
            backup(1, "2026-09-01 00:00:00"),
            backup(2, "2026-09-02 00:00:00"),
            backup(3, "2026-09-03 00:00:00"),
            backup(4, "2026-09-04 00:00:00"),
            backup(5, "2026-09-05 00:00:00"),
            backup(6, "2026-09-06 00:00:00"),
        ];
        backups[0].locked = true;
        backups[3].completed = None;
        backups[4].deleting = Some(now);
        backups[5].deleted = Some(now);
        assert_eq!(
            deletion_candidates(
                &backups,
                &BackupRetention {
                    count: 1,
                    ..Default::default()
                },
                now
            ),
            ids(&[2])
        );
    }

    #[test]
    fn failed_replacement_does_not_displace_previous_successful_backup() {
        let now = date("2026-09-07 12:00:00");
        let mut backups = vec![
            backup(1, "2026-09-01 00:00:00"),
            backup(2, "2026-09-07 11:00:00"),
        ];
        backups[1].successful = false;
        let retention = BackupRetention {
            count: 1,
            ..Default::default()
        };
        assert!(deletion_candidates(&backups, &retention, now).is_empty());
        assert_eq!(
            deletion_candidates(&backups, &retention, now + chrono::Duration::days(2)),
            ids(&[2])
        );
    }

    #[test]
    fn database_histories_are_isolated_and_orphan_metadata_preserves_identity() {
        let now = date("2026-09-07 12:00:00");
        let mut backups: Vec<_> = (1..=10)
            .map(|id| backup(id, "2026-09-01 00:00:00"))
            .collect();
        for backup in &mut backups[2..] {
            backup.kind = ServerBackupKind::DatabaseInstance;
            backup.database_type = Some(db_agent_api::DatabaseAgentType::Postgres);
        }
        backups[2].database_instance_uuid = Some(uuid::Uuid::from_u128(100));
        backups[2].metadata =
            serde_json::json!({"source_instance": {"uuid": uuid::Uuid::from_u128(200)}});
        backups[3].metadata =
            serde_json::json!({"source_instance": {"uuid": uuid::Uuid::from_u128(100)}});
        backups[4].database_instance_uuid = Some(uuid::Uuid::from_u128(200));
        backups[5].database_instance_uuid = Some(uuid::Uuid::from_u128(200));
        for backup in &mut backups[6..8] {
            backup.metadata =
                serde_json::json!({"source_instance": {"uuid": uuid::Uuid::from_u128(300)}});
        }
        backups[8].metadata = serde_json::json!({"source_instance": {"uuid": "invalid"}});
        assert_eq!(
            deletion_candidates(
                &backups,
                &BackupRetention {
                    count: 1,
                    ..Default::default()
                },
                now
            ),
            ids(&[1, 3, 5, 7])
        );
    }

    #[test]
    fn disabled_retention_still_reaps_failed_backups_past_the_grace_period() {
        let now = date("2026-09-07 12:00:00");
        let mut backups: Vec<_> = (1..=4)
            .map(|id| backup(id, "2026-01-01 00:00:00"))
            .collect();
        backups[1].successful = false;
        backups[1].completed = Some(now - chrono::Duration::hours(24));
        backups[2].successful = false;
        backups[2].completed = Some(now - chrono::Duration::hours(23));
        backups[3].successful = false;
        backups[3].completed = Some(now - chrono::Duration::days(7));
        backups[3].locked = true;

        assert_eq!(
            deletion_candidates(&backups, &BackupRetention::default(), now),
            ids(&[2])
        );
    }

    #[test]
    fn eviction_prefers_expendable_backups_and_never_offers_locked_ones() {
        let now = date("2026-09-07 12:00:00");
        let group = uuid::Uuid::from_u128(900);

        let mut backups: Vec<_> = (1..=8)
            .map(|id| backup(id, "2026-09-01 00:00:00"))
            .collect();
        for backup in &mut backups[..5] {
            backup.backup_group_uuid = Some(group);
        }
        backups[0].successful = false;
        backups[0].completed = Some(now - chrono::Duration::hours(24));
        backups[1].successful = false;
        backups[1].completed = Some(now - chrono::Duration::hours(1));
        backups[2].created = date("2026-09-02 00:00:00");
        backups[3].created = date("2026-09-03 00:00:00");
        backups[4].locked = true;
        backups[6].created = date("2026-09-04 00:00:00");
        backups[7].successful = false;
        backups[7].completed = Some(now - chrono::Duration::days(3));

        let retentions = std::collections::HashMap::from([(
            group,
            BackupRetention {
                count: 1,
                ..Default::default()
            },
        )]);

        assert_eq!(
            eviction_order(&backups, &retentions, ServerBackupKind::Server, now)
                .into_iter()
                .map(|(tier, backup)| (tier, backup.uuid))
                .collect::<Vec<_>>(),
            vec![
                (EvictionTier::ExpiredFailed, uuid::Uuid::from_u128(1)),
                (EvictionTier::ExpiredFailed, uuid::Uuid::from_u128(8)),
                (EvictionTier::OverRetention, uuid::Uuid::from_u128(3)),
                (EvictionTier::RecentFailed, uuid::Uuid::from_u128(2)),
                (EvictionTier::Ungrouped, uuid::Uuid::from_u128(6)),
                (EvictionTier::Ungrouped, uuid::Uuid::from_u128(7)),
                (EvictionTier::Retained, uuid::Uuid::from_u128(4)),
            ],
        );
    }

    #[test]
    fn fallback_eviction_only_sacrifices_backups_of_the_kind_being_created() {
        let now = date("2026-09-07 12:00:00");
        let instance = uuid::Uuid::from_u128(500);

        let mut backups = vec![
            backup(1, "2026-09-01 00:00:00"),
            backup(2, "2026-09-02 00:00:00"),
            backup(3, "2026-09-03 00:00:00"),
        ];
        for backup in &mut backups[1..] {
            backup.kind = ServerBackupKind::DatabaseInstance;
            backup.database_type = Some(db_agent_api::DatabaseAgentType::Postgres);
            backup.database_instance_uuid = Some(instance);
        }
        backups[2].successful = false;
        backups[2].completed = Some(now - chrono::Duration::days(2));

        let order = |kind| {
            eviction_order(&backups, &std::collections::HashMap::new(), kind, now)
                .into_iter()
                .map(|(tier, backup)| (tier, backup.uuid))
                .collect::<Vec<_>>()
        };

        assert_eq!(
            order(ServerBackupKind::Server),
            vec![
                (EvictionTier::ExpiredFailed, uuid::Uuid::from_u128(3)),
                (EvictionTier::Ungrouped, uuid::Uuid::from_u128(1)),
            ],
        );
        assert_eq!(
            order(ServerBackupKind::DatabaseInstance),
            vec![
                (EvictionTier::ExpiredFailed, uuid::Uuid::from_u128(3)),
                (EvictionTier::Ungrouped, uuid::Uuid::from_u128(2)),
            ],
        );
    }

    #[test]
    fn retention_patch_distinguishes_omission_null_and_object() {
        let group: UpdateServerBackupGroupOptions =
            serde_json::from_value(serde_json::json!({})).unwrap();
        let policy: UpdateSystemBackupPolicyOptions =
            serde_json::from_value(serde_json::json!({})).unwrap();
        assert!(group.retention.is_none());
        assert!(policy.retention.is_none());
        assert!(
            serde_json::to_value(group)
                .unwrap()
                .get("retention")
                .is_none()
        );
        assert!(
            serde_json::to_value(policy)
                .unwrap()
                .get("retention")
                .is_none()
        );
        assert!(
            serde_json::from_value::<UpdateServerBackupGroupOptions>(
                serde_json::json!({"retention": null})
            )
            .is_err()
        );
        assert!(
            serde_json::from_value::<UpdateSystemBackupPolicyOptions>(
                serde_json::json!({"retention": null})
            )
            .is_err()
        );
        for value in [
            serde_json::json!({}),
            serde_json::json!({"count": 20, "days": 7, "monthly": 12}),
        ] {
            let group: UpdateServerBackupGroupOptions =
                serde_json::from_value(serde_json::json!({"retention": value})).unwrap();
            let policy: UpdateSystemBackupPolicyOptions =
                serde_json::from_value(serde_json::json!({"retention": value})).unwrap();
            assert_eq!(group.retention, policy.retention);
            assert!(group.retention.is_some());
            assert!(group.validate().is_ok());
            assert!(policy.validate().is_ok());
        }
    }

    #[test]
    fn create_retention_defaults_to_unlimited_and_rejects_null() {
        let mut group = serde_json::json!({"server_uuid": uuid::Uuid::nil(), "name": "test"});
        let mut policy = serde_json::json!({"name": "test", "enabled": true, "cron": "0 0 0 * * *", "parallelism": 2});
        assert!(
            serde_json::from_value::<CreateServerBackupGroupOptions>(group.clone())
                .unwrap()
                .retention
                .is_disabled()
        );
        assert!(
            serde_json::from_value::<CreateSystemBackupPolicyOptions>(policy.clone())
                .unwrap()
                .retention
                .is_disabled()
        );
        group["retention"] = serde_json::Value::Null;
        policy["retention"] = serde_json::Value::Null;
        assert!(serde_json::from_value::<CreateServerBackupGroupOptions>(group).is_err());
        assert!(serde_json::from_value::<CreateSystemBackupPolicyOptions>(policy).is_err());
    }

    #[test]
    fn retention_bounds_preserve_legacy_integer_range_and_reject_overflow() {
        for field in ["count", "days", "daily", "weekly", "monthly", "yearly"] {
            let mut value = serde_json::json!({});
            value[field] = serde_json::json!(i32::MAX);
            let retention: BackupRetention = serde_json::from_value(value.clone()).unwrap();
            assert!(retention.validate().is_ok(), "{field}");
            value[field] = serde_json::json!(i32::MAX as u32 + 1);
            let retention: BackupRetention = serde_json::from_value(value.clone()).unwrap();
            assert!(retention.validate().is_err(), "{field}");
            value[field] = serde_json::json!(-1);
            assert!(
                serde_json::from_value::<BackupRetention>(value.clone()).is_err(),
                "{field}"
            );
            value[field] = serde_json::json!(u32::MAX as u64 + 1);
            assert!(
                serde_json::from_value::<BackupRetention>(value).is_err(),
                "{field}"
            );
        }
    }
}
