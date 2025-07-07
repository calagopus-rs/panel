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
    pub rules: HashMap<String, Vec<Box<dyn ValidateRule>>>,
    pub data: HashMap<String, String>,
}

impl Validator {
    pub fn new(data: HashMap<String, (Vec<String>, String)>) -> Result<Self, String> {
        let mut rules: HashMap<String, Vec<Box<dyn ValidateRule>>> = HashMap::new();
        for (key, (key_rules, _)) in &data {
            let mut rule_objects: Vec<Box<dyn ValidateRule>> = Vec::new();
            rule_objects.reserve_exact(key_rules.len());
            for rule in key_rules {
                match rules::parse_validation_rule(rule) {
                    Ok(parsed_rule) => rule_objects.push(parsed_rule),
                    Err(err) => return Err(format!("invalid rule '{rule}': {err}")),
                }
            }

            rules.insert(key.clone(), rule_objects);
        }

        Ok(Self {
            rules,
            data: data.into_iter().map(|(k, (_, v))| (k, v)).collect(),
        })
    }

    pub fn validate(&self) -> Result<(), String> {
        for (key, rules) in &self.rules {
            for rule in rules {
                match rule.validate(key, self) {
                    Ok(abort_early) => {
                        if abort_early {
                            break;
                        }
                    }
                    Err(err) => return Err(format!("{key}: {err}")),
                }
            }
        }

        Ok(())
    }
}

pub trait ValidateRule: Send + Sync {
    fn validate(&self, key: &str, validator: &Validator) -> Result<bool, String>;
}

pub trait ParseValidationRule: Send + Sync {
    fn parse_rule(rules: &[String]) -> Result<Box<dyn ValidateRule>, String>;
}
