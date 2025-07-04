use serde::{Deserialize, Deserializer};

#[inline]
pub fn deserialize_optional<'de, T, D>(deserializer: D) -> Result<Option<T>, D::Error>
where
    T: Deserialize<'de>,
    D: Deserializer<'de>,
{
    Ok(Option::deserialize(deserializer).ok().flatten())
}

#[inline]
pub fn deserialize_defaultable<'de, T, D>(deserializer: D) -> Result<T, D::Error>
where
    T: Deserialize<'de> + Default,
    D: Deserializer<'de>,
{
    Ok(T::deserialize(deserializer).unwrap_or_default())
}
