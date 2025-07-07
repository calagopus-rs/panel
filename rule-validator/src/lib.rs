use std::collections::HashMap;
use validator::ValidationError;

mod rules;

#[inline]
pub fn validate_rules(rules: &[String]) -> Result<(), ValidationError> {
    for rule in rules {
        if let Err(err) = rules::parse_validation_rule(rule) {
            return Err(ValidationError::new("invalid").with_message(err.into()));
        }
    }

    Ok(())
}

pub struct Validator {
    pub rules: Vec<Box<dyn ValidateRule>>,
    pub data: HashMap<String, String>,
}

impl Validator {
    pub fn new(rules: Vec<String>, data: HashMap<String, String>) -> Result<Self, String> {
        let mut parsed_rules = Vec::new();
        for rule in rules {
            let parsed_rule = rules::parse_validation_rule(&rule)?;
            parsed_rules.push(parsed_rule);
        }

        Ok(Self {
            rules: parsed_rules,
            data,
        })
    }

    pub fn validate(&self) -> Result<(), String> {
        for rule in &self.rules {
            for key in self.data.keys() {
                if let Err(err) = rule.validate(key, self) {
                    return Err(format!("{key}: {err}"));
                }
            }
        }

        Ok(())
    }
}

pub trait ValidateRule {
    fn validate(&self, key: &str, validator: &Validator) -> Result<(), String>;
}

pub trait ParseValidationRule {
    fn parse_rule(rules: &[String]) -> Result<Box<dyn ValidateRule>, String>;
}
