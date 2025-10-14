use serde::{Deserialize, Deserializer, de::DeserializeOwned};

pub fn deserialize_string_option<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    let value: Option<String> = Option::deserialize(deserializer).unwrap_or_default();
    Ok(value.filter(|s| !s.is_empty()))
}

pub fn deserialize_pre_stringified<'de, D, T: DeserializeOwned>(
    deserializer: D,
) -> Result<T, D::Error>
where
    D: Deserializer<'de>,
{
    let value: serde_json::Value = serde_json::Value::deserialize(deserializer)?;
    let value: T = match value {
        serde_json::Value::String(value) => {
            serde_json::from_str(&value).map_err(|err| serde::de::Error::custom(err))?
        }
        value => serde_json::from_value(value).map_err(|err| serde::de::Error::custom(err))?,
    };

    Ok(value)
}

pub fn deserialize_nest_egg_config_stop<'de, D>(
    deserializer: D,
) -> Result<crate::models::nest_egg::NestEggConfigStop, D::Error>
where
    D: Deserializer<'de>,
{
    let value: serde_json::Value = serde_json::Value::deserialize(deserializer)?;
    let value: crate::models::nest_egg::NestEggConfigStop = match value {
        serde_json::Value::String(value) => serde_json::from_str(&value).unwrap_or_else(|_| {
            crate::models::nest_egg::NestEggConfigStop {
                r#type: "command".into(),
                value: Some(value),
            }
        }),
        value => serde_json::from_value(value).map_err(|err| serde::de::Error::custom(err))?,
    };

    Ok(value)
}
