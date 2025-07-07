use super::{ParseValidationRule, ValidateRule, Validator};

pub fn parse_validation_rule(rule: &str) -> Result<Box<dyn ValidateRule>, String> {
    let mut rule_parts = rule.splitn(2, ':');
    let rule_name = rule_parts.next().ok_or("invalid rule format".to_string())?;
    let rule_args: Vec<String> = rule_parts
        .next()
        .map(|args| args.split(',').map(String::from).collect())
        .unwrap_or_default();

    match rule_name {
        "accepted" => Accepted::parse_rule(&rule_args),
        "accepted_if" => AcceptedIf::parse_rule(&rule_args),
        "alpha" => Alpha::parse_rule(&rule_args),
        "alpha_dash" => AlphaDash::parse_rule(&rule_args),
        "alpha_num" => AlphaNum::parse_rule(&rule_args),
        "ascii" => Ascii::parse_rule(&rule_args),
        "between" => Between::parse_rule(&rule_args),
        "boolean" => Boolean::parse_rule(&rule_args),
        "confirmed" => Confirmed::parse_rule(&rule_args),
        "date" => Date::parse_rule(&rule_args),
        "date_format" => DateFormat::parse_rule(&rule_args),
        "declined" => Declined::parse_rule(&rule_args),
        "declined_if" => DeclinedIf::parse_rule(&rule_args),
        "different" => Different::parse_rule(&rule_args),
        "digits" => Digits::parse_rule(&rule_args),
        "digits_between" => DigitsBetween::parse_rule(&rule_args),
        "doesnt_start_with" => DoesntStartWith::parse_rule(&rule_args),
        "doesnt_end_with" => DoesntEndWith::parse_rule(&rule_args),
        "ends_with" => EndsWith::parse_rule(&rule_args),
        "gt" => Gt::parse_rule(&rule_args),
        "gte" => Gte::parse_rule(&rule_args),
        "hex_color" => HexColor::parse_rule(&rule_args),
        "in" => In::parse_rule(&rule_args),
        "integer" | "int" => Integer::parse_rule(&rule_args),
        "ip" => Ip::parse_rule(&rule_args),
        "ipv4" => Ipv4::parse_rule(&rule_args),
        "ipv6" => Ipv6::parse_rule(&rule_args),
        "json" => Json::parse_rule(&rule_args),
        "lt" => Lt::parse_rule(&rule_args),
        "lte" => Lte::parse_rule(&rule_args),
        "lowercase" => Lowercase::parse_rule(&rule_args),
        "mac_address" => MacAddress::parse_rule(&rule_args),
        "max" => Max::parse_rule(&rule_args),
        "max_digits" => MaxDigits::parse_rule(&rule_args),
        "min" => Min::parse_rule(&rule_args),
        "min_digits" => MinDigits::parse_rule(&rule_args),
        "multiple_of" => MultipleOf::parse_rule(&rule_args),
        "not_in" => NotIn::parse_rule(&rule_args),
        "not_regex" => NotRegex::parse_rule(&rule_args),
        "nullable" => Nullable::parse_rule(&rule_args),
        "numeric" | "num" => Numeric::parse_rule(&rule_args),
        "regex" => Regex::parse_rule(&rule_args),
        "required" => Required::parse_rule(&rule_args),
        "required_if" => RequiredIf::parse_rule(&rule_args),
        "required_if_accepted" => RequiredIfAccepted::parse_rule(&rule_args),
        "required_if_declined" => RequiredIfDeclined::parse_rule(&rule_args),
        "same" => Same::parse_rule(&rule_args),
        "size" => Size::parse_rule(&rule_args),
        "starts_with" => StartsWith::parse_rule(&rule_args),
        "string" | "str" => StringRule::parse_rule(&rule_args),
        "timezone" => Timezone::parse_rule(&rule_args),
        "uppercase" => Uppercase::parse_rule(&rule_args),
        "url" => Url::parse_rule(&rule_args),
        "uuid" => Uuid::parse_rule(&rule_args),
        rule => Err(format!("unknown or unsupported validation rule: {rule}")),
    }
}

pub struct Accepted;

impl ParseValidationRule for Accepted {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Accepted))
    }
}

impl ValidateRule for Accepted {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        match data.data.get(key).map(String::as_str) {
            Some("true") | Some("1") | Some("yes") | Some("on") => Ok(()),
            _ => Err("value must be 'true', '1', 'yes', or 'on'".to_string()),
        }
    }
}

pub struct AcceptedIf {
    keys: Vec<(String, String)>,
}

impl ParseValidationRule for AcceptedIf {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() < 2 {
            return Err("accepted_if requires a key and value to check".to_string());
        }

        let mut keys = Vec::new();
        for i in (0..rule.len()).step_by(2) {
            if i + 1 < rule.len() {
                keys.push((rule[i].clone(), rule[i + 1].clone()));
            } else {
                return Err("accepted_if requires an even number of arguments".to_string());
            }
        }

        Ok(Box::new(AcceptedIf { keys }))
    }
}

impl ValidateRule for AcceptedIf {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        for (check_key, check_value) in &self.keys {
            if let Some(value) = data.data.get(check_key) {
                if value == check_value {
                    match data.data.get(key).map(String::as_str) {
                        Some("true") | Some("1") | Some("yes") | Some("on") => return Ok(()),
                        _ => {
                            return Err("must be 'true', '1', 'yes', or 'on'".to_string());
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

pub struct Alpha {
    only_ascii: bool,
}

impl ParseValidationRule for Alpha {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        let only_ascii = rule.first().is_some_and(|s| s == "ascii");

        Ok(Box::new(Alpha { only_ascii }))
    }
}

impl ValidateRule for Alpha {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if self.only_ascii {
                if value.chars().all(|c| c.is_ascii_alphabetic()) {
                    return Ok(());
                }
            } else if value.chars().all(|c| c.is_alphabetic()) {
                return Ok(());
            }
        }

        Err("must contain only alphabetic characters".to_string())
    }
}

pub struct AlphaDash {
    only_ascii: bool,
}

impl ParseValidationRule for AlphaDash {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        let only_ascii = rule.first().is_some_and(|s| s == "ascii");

        Ok(Box::new(AlphaDash { only_ascii }))
    }
}

impl ValidateRule for AlphaDash {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if self.only_ascii {
                if value
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
                {
                    return Ok(());
                }
            } else if value
                .chars()
                .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
            {
                return Ok(());
            }
        }

        Err("must contain only alphanumeric characters, dashes, or underscores".to_string())
    }
}

pub struct AlphaNum {
    only_ascii: bool,
}

impl ParseValidationRule for AlphaNum {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        let only_ascii = rule.first().is_some_and(|s| s == "ascii");

        Ok(Box::new(AlphaNum { only_ascii }))
    }
}

impl ValidateRule for AlphaNum {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if self.only_ascii {
                if value.chars().all(|c| c.is_ascii_alphanumeric()) {
                    return Ok(());
                }
            } else if value.chars().all(|c| c.is_alphanumeric()) {
                return Ok(());
            }
        }

        Err("must contain only alphanumeric characters".to_string())
    }
}

pub struct Ascii;

impl ParseValidationRule for Ascii {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Ascii))
    }
}

impl ValidateRule for Ascii {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.is_ascii() {
                return Ok(());
            }
        }

        Err("must contain only ASCII characters".to_string())
    }
}

pub struct Between {
    min: f64,
    max: f64,
}

impl ParseValidationRule for Between {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 2 {
            return Err("between requires two numeric values".to_string());
        }

        let min = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid minimum value".to_string())?;
        let max = rule[1]
            .parse::<f64>()
            .map_err(|_| "invalid maximum value".to_string())?;

        Ok(Box::new(Between { min, max }))
    }
}

impl ValidateRule for Between {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num >= self.min && num <= self.max {
                    return Ok(());
                }
            } else if value.len() >= self.min as usize && value.len() <= self.max as usize {
                return Ok(());
            }
        }

        Err(format!("must be between {} and {}", self.min, self.max))
    }
}

pub struct Boolean;

impl ParseValidationRule for Boolean {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Boolean))
    }
}

impl ValidateRule for Boolean {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        match data.data.get(key).map(String::as_str) {
            Some("true") | Some("1") | Some("yes") | Some("on") | Some("false") | Some("0")
            | Some("no") | Some("off") => Ok(()),
            _ => Err("must be a boolean (true/false, 1/0, yes/no, on/off)".to_string()),
        }
    }
}

pub struct Confirmed;

impl ParseValidationRule for Confirmed {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Confirmed))
    }
}

impl ValidateRule for Confirmed {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        let confirm_key = format!("{}{}", key, "_confirmation");
        if let Some(value) = data.data.get(key) {
            if let Some(confirm_value) = data.data.get(&confirm_key) {
                if value == confirm_value {
                    return Ok(());
                }
            }
        }

        Err(format!("does not match confirmation field '{confirm_key}'"))
    }
}

pub struct Date;

impl ParseValidationRule for Date {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Date))
    }
}

impl ValidateRule for Date {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.parse::<chrono::NaiveDate>().is_ok() {
                return Ok(());
            }
        }

        Err("must be a valid date".to_string())
    }
}

pub struct DateFormat {
    format: String,
}

impl ParseValidationRule for DateFormat {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("date_format requires a format string".to_string());
        }

        let format = rule[0].clone();
        Ok(Box::new(DateFormat { format }))
    }
}

impl ValidateRule for DateFormat {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if chrono::NaiveDate::parse_from_str(value, &self.format).is_ok() {
                return Ok(());
            }
        }

        Err(format!("must match the format '{}'", self.format))
    }
}

pub struct Declined;

impl ParseValidationRule for Declined {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Declined))
    }
}

impl ValidateRule for Declined {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        match data.data.get(key).map(String::as_str) {
            Some("false") | Some("0") | Some("no") | Some("off") => Ok(()),
            _ => Err("value must be 'false', '0', 'no', or 'off'".to_string()),
        }
    }
}

pub struct DeclinedIf {
    keys: Vec<(String, String)>,
}

impl ParseValidationRule for DeclinedIf {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() < 2 {
            return Err("declined_if requires a key and value to check".to_string());
        }

        let mut keys = Vec::new();
        for i in (0..rule.len()).step_by(2) {
            if i + 1 < rule.len() {
                keys.push((rule[i].clone(), rule[i + 1].clone()));
            } else {
                return Err("declined_if requires an even number of arguments".to_string());
            }
        }

        Ok(Box::new(DeclinedIf { keys }))
    }
}

impl ValidateRule for DeclinedIf {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        for (check_key, check_value) in &self.keys {
            if let Some(value) = data.data.get(check_key) {
                if value == check_value {
                    match data.data.get(key).map(String::as_str) {
                        Some("false") | Some("0") | Some("no") | Some("off") => return Ok(()),
                        _ => {
                            return Err("must be 'false', '0', 'no', or 'off'".to_string());
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

pub struct Different {
    other_key: String,
}

impl ParseValidationRule for Different {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("different requires one key to compare against".to_string());
        }

        Ok(Box::new(Different {
            other_key: rule[0].clone(),
        }))
    }
}

impl ValidateRule for Different {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Some(other_value) = data.data.get(&self.other_key) {
                if value != other_value {
                    return Ok(());
                }
            }
        }

        Err(format!("must be different from '{}'", self.other_key))
    }
}

pub struct Digits {
    length: usize,
}

impl ParseValidationRule for Digits {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("digits requires one numeric value for length".to_string());
        }

        let length = rule[0]
            .parse::<usize>()
            .map_err(|_| "invalid length value".to_string())?;

        Ok(Box::new(Digits { length }))
    }
}

impl ValidateRule for Digits {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.chars().all(|c| c.is_ascii_digit()) && value.len() == self.length {
                return Ok(());
            }
        }

        Err(format!("must contain exactly {} digits", self.length))
    }
}

pub struct DigitsBetween {
    minimum: usize,
    maximum: usize,
}

impl ParseValidationRule for DigitsBetween {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 2 {
            return Err("digits_between requires two numeric values".to_string());
        }

        let minimum = rule[0]
            .parse::<usize>()
            .map_err(|_| "invalid minimum value".to_string())?;
        let maximum = rule[1]
            .parse::<usize>()
            .map_err(|_| "invalid maximum value".to_string())?;

        Ok(Box::new(DigitsBetween { minimum, maximum }))
    }
}

impl ValidateRule for DigitsBetween {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.chars().all(|c| c.is_ascii_digit()) {
                let len = value.len();
                if len >= self.minimum && len <= self.maximum {
                    return Ok(());
                }
            }
        }

        Err(format!(
            "must contain between {} and {} digits",
            self.minimum, self.maximum
        ))
    }
}

pub struct DoesntStartWith {
    prefixes: Vec<String>,
}

impl ParseValidationRule for DoesntStartWith {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("doesnt_start_with requires at least one prefix".to_string());
        }

        Ok(Box::new(DoesntStartWith {
            prefixes: rule.to_vec(),
        }))
    }
}

impl ValidateRule for DoesntStartWith {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            for prefix in &self.prefixes {
                if value.starts_with(prefix) {
                    return Err(format!("must not start with '{prefix}'"));
                }
            }
        }

        Ok(())
    }
}

pub struct DoesntEndWith {
    suffixes: Vec<String>,
}

impl ParseValidationRule for DoesntEndWith {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("doesnt_end_with requires at least one suffix".to_string());
        }

        Ok(Box::new(DoesntEndWith {
            suffixes: rule.to_vec(),
        }))
    }
}

impl ValidateRule for DoesntEndWith {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            for suffix in &self.suffixes {
                if value.ends_with(suffix) {
                    return Err(format!("must not end with '{suffix}'"));
                }
            }
        }

        Ok(())
    }
}

pub struct EndsWith {
    suffixes: Vec<String>,
}

impl ParseValidationRule for EndsWith {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("ends_with requires at least one suffix".to_string());
        }

        Ok(Box::new(EndsWith {
            suffixes: rule.to_vec(),
        }))
    }
}

impl ValidateRule for EndsWith {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            for suffix in &self.suffixes {
                if value.ends_with(suffix) {
                    return Err(format!("must not end with '{suffix}'"));
                }
            }
        }

        Ok(())
    }
}

pub struct Gt {
    value: f64,
}

impl ParseValidationRule for Gt {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("gt requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid value for gt".to_string())?;

        Ok(Box::new(Gt { value }))
    }
}

impl ValidateRule for Gt {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num > self.value {
                    return Ok(());
                }
            } else if value.len() > self.value as usize {
                return Ok(());
            }
        }

        Err(format!("must be greater than {}", self.value))
    }
}

pub struct Gte {
    value: f64,
}

impl ParseValidationRule for Gte {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("gte requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid value for gte".to_string())?;

        Ok(Box::new(Gte { value }))
    }
}

impl ValidateRule for Gte {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num >= self.value {
                    return Ok(());
                }
            } else if value.len() >= self.value as usize {
                return Ok(());
            }
        }

        Err(format!("must be greater than or equal to {}", self.value))
    }
}

pub struct HexColor;

impl ParseValidationRule for HexColor {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(HexColor))
    }
}

impl ValidateRule for HexColor {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.starts_with('#')
                && value.len() == 7
                && value[1..].chars().all(|c| c.is_ascii_hexdigit())
            {
                return Ok(());
            }
        }

        Err("must be a valid hex color code".to_string())
    }
}

pub struct In {
    options: Vec<String>,
}

impl ParseValidationRule for In {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("in requires at least one option".to_string());
        }

        Ok(Box::new(In {
            options: rule.to_vec(),
        }))
    }
}

impl ValidateRule for In {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if self.options.contains(value) {
                return Ok(());
            }
        }

        Err(format!("must be one of: {}", self.options.join(", ")))
    }
}

pub struct Integer;

impl ParseValidationRule for Integer {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Integer))
    }
}

impl ValidateRule for Integer {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.chars().all(|c| c.is_ascii_digit()) {
                return Ok(());
            }
        }

        Err("must be a valid integer".to_string())
    }
}

pub struct Ip;

impl ParseValidationRule for Ip {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Ip))
    }
}

impl ValidateRule for Ip {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.parse::<std::net::IpAddr>().is_ok() {
                return Ok(());
            }
        }

        Err("must be a valid IP address".to_string())
    }
}

pub struct Ipv4;

impl ParseValidationRule for Ipv4 {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Ipv4))
    }
}

impl ValidateRule for Ipv4 {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.parse::<std::net::Ipv4Addr>().is_ok() {
                return Ok(());
            }
        }

        Err("must be a valid IPv4 address".to_string())
    }
}

pub struct Ipv6;

impl ParseValidationRule for Ipv6 {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Ipv6))
    }
}

impl ValidateRule for Ipv6 {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.parse::<std::net::Ipv6Addr>().is_ok() {
                return Ok(());
            }
        }

        Err("must be a valid IPv6 address".to_string())
    }
}

pub struct Json;

impl ParseValidationRule for Json {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Json))
    }
}

impl ValidateRule for Json {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if serde_json::from_str::<serde_json::Value>(value).is_ok() {
                return Ok(());
            }
        }

        Err("must be valid JSON".to_string())
    }
}

pub struct Lt {
    value: f64,
}

impl ParseValidationRule for Lt {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("lt requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid value for lt".to_string())?;

        Ok(Box::new(Lt { value }))
    }
}

impl ValidateRule for Lt {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num < self.value {
                    return Ok(());
                }
            } else if value.len() < self.value as usize {
                return Ok(());
            }
        }

        Err(format!("must be less than {}", self.value))
    }
}

pub struct Lte {
    value: f64,
}

impl ParseValidationRule for Lte {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("lte requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid value for lte".to_string())?;

        Ok(Box::new(Lte { value }))
    }
}

impl ValidateRule for Lte {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num <= self.value {
                    return Ok(());
                }
            } else if value.len() <= self.value as usize {
                return Ok(());
            }
        }

        Err(format!("must be less than or equal to {}", self.value))
    }
}

pub struct Lowercase;

impl ParseValidationRule for Lowercase {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Lowercase))
    }
}

impl ValidateRule for Lowercase {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.chars().all(|c| c.is_lowercase()) {
                return Ok(());
            }
        }

        Err("must be lowercase".to_string())
    }
}

pub struct MacAddress;

impl ParseValidationRule for MacAddress {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(MacAddress))
    }
}

impl ValidateRule for MacAddress {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            let parts: Vec<&str> = value.split(':').collect();
            if parts.len() == 6
                && parts
                    .iter()
                    .all(|part| part.len() == 2 && part.chars().all(|c| c.is_ascii_hexdigit()))
            {
                return Ok(());
            }
        }

        Err("must be a valid MAC address".to_string())
    }
}

pub struct Max {
    value: f64,
}

impl ParseValidationRule for Max {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("max requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid value for max".to_string())?;

        Ok(Box::new(Max { value }))
    }
}

impl ValidateRule for Max {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num <= self.value {
                    return Ok(());
                }
            } else if value.len() <= self.value as usize {
                return Ok(());
            }
        }

        Err(format!("must be less than or equal to {}", self.value))
    }
}

pub struct MaxDigits {
    value: usize,
}

impl ParseValidationRule for MaxDigits {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("max_digits requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<usize>()
            .map_err(|_| "invalid value for max_digits".to_string())?;

        Ok(Box::new(MaxDigits { value }))
    }
}

impl ValidateRule for MaxDigits {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.chars().all(|c| c.is_ascii_digit()) && value.len() <= self.value {
                return Ok(());
            }
        }

        Err(format!("must contain at most {} digits", self.value))
    }
}

pub struct Min {
    value: f64,
}

impl ParseValidationRule for Min {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("min requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid value for min".to_string())?;

        Ok(Box::new(Min { value }))
    }
}

impl ValidateRule for Min {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num >= self.value {
                    return Ok(());
                }
            } else if value.len() >= self.value as usize {
                return Ok(());
            }
        }

        Err(format!("must be greater than or equal to {}", self.value))
    }
}

pub struct MinDigits {
    value: usize,
}

impl ParseValidationRule for MinDigits {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("min_digits requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<usize>()
            .map_err(|_| "invalid value for min_digits".to_string())?;

        Ok(Box::new(MinDigits { value }))
    }
}

impl ValidateRule for MinDigits {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.chars().all(|c| c.is_ascii_digit()) && value.len() >= self.value {
                return Ok(());
            }
        }

        Err(format!("must contain at least {} digits", self.value))
    }
}

pub struct MultipleOf {
    value: f64,
}

impl ParseValidationRule for MultipleOf {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("multiple_of requires one numeric value".to_string());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid value for multiple_of".to_string())?;

        Ok(Box::new(MultipleOf { value }))
    }
}

impl ValidateRule for MultipleOf {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num % self.value == 0.0 {
                    return Ok(());
                }
            }
        }

        Err(format!("must be a multiple of {}", self.value))
    }
}

pub struct NotIn {
    options: Vec<String>,
}

impl ParseValidationRule for NotIn {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("not_in requires at least one option".to_string());
        }

        Ok(Box::new(NotIn {
            options: rule.to_vec(),
        }))
    }
}

impl ValidateRule for NotIn {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if !self.options.contains(value) {
                return Ok(());
            }
        }

        Err(format!("must not be one of: {}", self.options.join(", ")))
    }
}

pub struct NotRegex {
    pattern: regex::Regex,
}

impl ParseValidationRule for NotRegex {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("not_regex requires a regex pattern".to_string());
        }

        let pattern = rule[0].clone();
        let regex = regex::Regex::new(&pattern).map_err(|_| "invalid regex pattern".to_string())?;

        Ok(Box::new(NotRegex { pattern: regex }))
    }
}

impl ValidateRule for NotRegex {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if !self.pattern.is_match(value) {
                return Ok(());
            }
        }

        Err(format!(
            "must not match the regex pattern '{}'",
            self.pattern
        ))
    }
}

pub struct Nullable;

impl ParseValidationRule for Nullable {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Nullable))
    }
}

impl ValidateRule for Nullable {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if !data.data.contains_key(key) || data.data.get(key).unwrap().is_empty() {
            return Ok(());
        }

        Err("must be null or empty".to_string())
    }
}

pub struct Numeric;

impl ParseValidationRule for Numeric {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Numeric))
    }
}

impl ValidateRule for Numeric {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value
                .chars()
                .all(|c| c.is_ascii_digit() || c == '.' || c == '-' || c == '+')
            {
                return Ok(());
            }
        }

        Err("must be a valid numeric value".to_string())
    }
}

pub struct Regex {
    pattern: regex::Regex,
}

impl ParseValidationRule for Regex {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("regex requires a regex pattern".to_string());
        }

        let pattern = rule[0].clone();
        let regex = regex::Regex::new(&pattern).map_err(|_| "invalid regex pattern".to_string())?;

        Ok(Box::new(Regex { pattern: regex }))
    }
}

impl ValidateRule for Regex {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if self.pattern.is_match(value) {
                return Ok(());
            }
        }

        Err(format!("must match the regex pattern '{}'", self.pattern))
    }
}

pub struct Required;

impl ParseValidationRule for Required {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Required))
    }
}

impl ValidateRule for Required {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if !value.is_empty() {
                return Ok(());
            }
        }

        Err("is required and cannot be empty".to_string())
    }
}

pub struct RequiredIf {
    keys: Vec<(String, String)>,
}

impl ParseValidationRule for RequiredIf {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() < 2 {
            return Err("required_if requires a key and value to check".to_string());
        }

        let mut keys = Vec::new();
        for i in (0..rule.len()).step_by(2) {
            if i + 1 < rule.len() {
                keys.push((rule[i].clone(), rule[i + 1].clone()));
            } else {
                return Err("required_if requires an even number of arguments".to_string());
            }
        }

        Ok(Box::new(RequiredIf { keys }))
    }
}

impl ValidateRule for RequiredIf {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        for (check_key, check_value) in &self.keys {
            if let Some(value) = data.data.get(check_key) {
                if value == check_value {
                    if let Some(field_value) = data.data.get(key) {
                        if !field_value.is_empty() {
                            return Ok(());
                        }
                    }
                    return Err(format!("is required when '{check_key}' is '{check_value}'"));
                }
            }
        }

        Ok(())
    }
}

pub struct RequiredIfAccepted {
    other_key: String,
}

impl ParseValidationRule for RequiredIfAccepted {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("required_if_accepted requires one key to check".to_string());
        }

        Ok(Box::new(RequiredIfAccepted {
            other_key: rule[0].clone(),
        }))
    }
}

impl ValidateRule for RequiredIfAccepted {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(&self.other_key) {
            if value == "true" || value == "1" || value == "yes" || value == "on" {
                if let Some(field_value) = data.data.get(key) {
                    if !field_value.is_empty() {
                        return Ok(());
                    }
                }

                return Err(format!("is required when '{}' is accepted", self.other_key));
            }
        }

        Ok(())
    }
}

pub struct RequiredIfDeclined {
    other_key: String,
}

impl ParseValidationRule for RequiredIfDeclined {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("required_if_declined requires one key to check".to_string());
        }

        Ok(Box::new(RequiredIfDeclined {
            other_key: rule[0].clone(),
        }))
    }
}

impl ValidateRule for RequiredIfDeclined {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(&self.other_key) {
            if value == "false" || value == "0" || value == "no" || value == "off" {
                if let Some(field_value) = data.data.get(key) {
                    if !field_value.is_empty() {
                        return Ok(());
                    }
                }

                return Err(format!("is required when '{}' is declined", self.other_key));
            }
        }

        Ok(())
    }
}

pub struct Same {
    other_key: String,
}

impl ParseValidationRule for Same {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("same requires one key to compare against".to_string());
        }

        Ok(Box::new(Same {
            other_key: rule[0].clone(),
        }))
    }
}

impl ValidateRule for Same {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Some(other_value) = data.data.get(&self.other_key) {
                if value == other_value {
                    return Ok(());
                }
            }
        }

        Err(format!("must be the same as '{}'", self.other_key))
    }
}

pub struct Size {
    size: f64,
}

impl ParseValidationRule for Size {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.len() != 1 {
            return Err("size requires one numeric value".to_string());
        }

        let size = rule[0]
            .parse::<f64>()
            .map_err(|_| "invalid value for size".to_string())?;

        Ok(Box::new(Size { size }))
    }
}

impl ValidateRule for Size {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num == self.size {
                    return Ok(());
                }
            } else if value.len() == self.size as usize {
                return Ok(());
            }
        }

        Err(format!("must be equal to {}", self.size))
    }
}

pub struct StartsWith {
    prefixes: Vec<String>,
}

impl ParseValidationRule for StartsWith {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        if rule.is_empty() {
            return Err("starts_with requires at least one prefix".to_string());
        }

        Ok(Box::new(StartsWith {
            prefixes: rule.to_vec(),
        }))
    }
}

impl ValidateRule for StartsWith {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            for prefix in &self.prefixes {
                if value.starts_with(prefix) {
                    return Ok(());
                }
            }
        }

        Err(format!(
            "must start with one of: {}",
            self.prefixes.join(", ")
        ))
    }
}

pub struct StringRule;

impl ParseValidationRule for StringRule {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(StringRule))
    }
}

impl ValidateRule for StringRule {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if !value.is_empty() {
                return Ok(());
            }
        }

        Err("must be a non-empty string".to_string())
    }
}

pub struct Timezone;

impl ParseValidationRule for Timezone {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Timezone))
    }
}

impl ValidateRule for Timezone {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.parse::<chrono::FixedOffset>().is_ok() || value == "UTC" {
                return Ok(());
            }
        }

        Err("must be a valid timezone".to_string())
    }
}

pub struct Uppercase;

impl ParseValidationRule for Uppercase {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Uppercase))
    }
}

impl ValidateRule for Uppercase {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if value.chars().all(|c| c.is_uppercase()) {
                return Ok(());
            }
        }

        Err("must be uppercase".to_string())
    }
}

pub struct Url {
    protocols: Vec<String>,
}

impl ParseValidationRule for Url {
    fn parse_rule(rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Url {
            protocols: rule.to_vec(),
        }))
    }
}

impl ValidateRule for Url {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if let Ok(url) = reqwest::Url::parse(value) {
                if self.protocols.contains(&url.scheme().to_string()) {
                    return Ok(());
                }
            }
        }

        Err(format!(
            "must be a valid URL with one of the following protocols: {}",
            self.protocols.join(", ")
        ))
    }
}

pub struct Uuid;

impl ParseValidationRule for Uuid {
    fn parse_rule(_rule: &[String]) -> Result<Box<dyn ValidateRule>, String> {
        Ok(Box::new(Uuid))
    }
}

impl ValidateRule for Uuid {
    fn validate(&self, key: &str, data: &Validator) -> Result<(), String> {
        if let Some(value) = data.data.get(key) {
            if uuid::Uuid::parse_str(value).is_ok() {
                return Ok(());
            }
        }

        Err("must be a valid UUID".to_string())
    }
}
