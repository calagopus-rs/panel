use hmac::digest::KeyInit;
use jwt::{RegisteredClaims, SignWithKey, VerifyWithKey};
use serde::{Deserialize, Serialize, de::DeserializeOwned};

#[derive(Deserialize, Serialize)]
pub struct BasePayload {
    #[serde(rename = "iss")]
    pub issuer: String,
    #[serde(rename = "sub")]
    pub subject: Option<String>,
    #[serde(rename = "aud")]
    pub audience: Vec<String>,
    #[serde(rename = "exp")]
    pub expiration_time: Option<i64>,
    #[serde(rename = "nbf")]
    pub not_before: Option<i64>,
    #[serde(rename = "iat")]
    pub issued_at: Option<i64>,
    #[serde(rename = "jti")]
    pub jwt_id: String,
}

impl BasePayload {
    pub fn validate(&self) -> bool {
        let now = chrono::Utc::now().timestamp();

        if let Some(exp) = self.expiration_time {
            if exp < now {
                return false;
            }
        } else {
            return false;
        }

        if let Some(nbf) = self.not_before {
            if nbf > now {
                return false;
            }
        }

        if let Some(iat) = self.issued_at {
            if iat > now {
                return false;
            }
        } else {
            return false;
        }

        true
    }
}

pub struct Jwt {
    pub key: hmac::Hmac<sha2::Sha256>,
}

impl Jwt {
    pub fn new(env: &crate::env::Env) -> Self {
        Self {
            key: hmac::Hmac::new_from_slice(env.app_encryption_key.as_bytes()).unwrap(),
        }
    }

    #[inline]
    pub fn verify<T: DeserializeOwned>(&self, token: &str) -> Result<T, jwt::Error> {
        token.verify_with_key(&self.key)
    }

    #[inline]
    pub fn verify_node<T: DeserializeOwned>(
        &self,
        token: &str,
        node: &crate::models::node::Node,
    ) -> Result<T, jwt::Error> {
        token.verify_with_key(&hmac::Hmac::<sha2::Sha256>::new_from_slice(
            node.token.as_bytes(),
        )?)
    }

    #[inline]
    pub fn create<T: Serialize>(&self, payload: &T) -> Result<String, jwt::Error> {
        payload.sign_with_key(&self.key)
    }

    #[inline]
    pub fn create_node<T: Serialize>(
        &self,
        node: &crate::models::node::Node,
        payload: &T,
    ) -> Result<String, jwt::Error> {
        payload.sign_with_key(&hmac::Hmac::<sha2::Sha256>::new_from_slice(
            node.token.as_bytes(),
        )?)
    }
}
