use super::{ParseValidationRule, ValidateRule, Validator};

pub fn parse_validation_rule(
    rule: &str,
) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
    let mut rule_parts = rule.splitn(2, ':');
    let rule_name = rule_parts.next().ok_or("invalid rule format".to_string())?;
    let rule_args: Vec<compact_str::CompactString> = rule_parts
        .next()
        .map(|args| {
            args.split(',')
                .map(compact_str::CompactString::from)
                .collect()
        })
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
        rule => Err(compact_str::format_compact!(
            "unknown or unsupported validation rule: {rule}"
        )),
    }
}

pub struct Accepted;

impl ParseValidationRule for Accepted {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Accepted))
    }
}

impl ValidateRule for Accepted {
    fn label(&self) -> &'static str {
        "accepted"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        match data.data.get(key).copied() {
            Some("true") | Some("1") | Some("yes") | Some("on") => Ok(false),
            _ => Err("value must be 'true', '1', 'yes', or 'on'".into()),
        }
    }
}

pub struct AcceptedIf {
    keys: Vec<(compact_str::CompactString, compact_str::CompactString)>,
}

impl ParseValidationRule for AcceptedIf {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() < 2 {
            return Err("accepted_if requires a key and value to check".into());
        }

        let mut keys = Vec::new();
        for i in (0..rule.len()).step_by(2) {
            if i + 1 < rule.len() {
                keys.push((rule[i].clone(), rule[i + 1].clone()));
            } else {
                return Err("accepted_if requires an even number of arguments".into());
            }
        }

        Ok(Box::new(AcceptedIf { keys }))
    }
}

impl ValidateRule for AcceptedIf {
    fn label(&self) -> &'static str {
        "accepted_if"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        for (check_key, check_value) in &self.keys {
            if let Some(value) = data.data.get(check_key.as_str())
                && value == check_value
            {
                match data.data.get(key).copied() {
                    Some("true") | Some("1") | Some("yes") | Some("on") => return Ok(false),
                    _ => {
                        return Err("must be 'true', '1', 'yes', or 'on'".into());
                    }
                }
            }
        }

        Ok(false)
    }
}

pub struct Alpha {
    only_ascii: bool,
}

impl ParseValidationRule for Alpha {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        let only_ascii = rule.first().is_some_and(|s| s == "ascii");

        Ok(Box::new(Alpha { only_ascii }))
    }
}

impl ValidateRule for Alpha {
    fn label(&self) -> &'static str {
        "alpha"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if self.only_ascii {
                if value.chars().all(|c| c.is_ascii_alphabetic()) {
                    return Ok(false);
                }
            } else if value.chars().all(|c| c.is_alphabetic()) {
                return Ok(false);
            }
        }

        Err("must contain only alphabetic characters".into())
    }
}

pub struct AlphaDash {
    only_ascii: bool,
}

impl ParseValidationRule for AlphaDash {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        let only_ascii = rule.first().is_some_and(|s| s == "ascii");

        Ok(Box::new(AlphaDash { only_ascii }))
    }
}

impl ValidateRule for AlphaDash {
    fn label(&self) -> &'static str {
        "alpha_dash"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if self.only_ascii {
                if value
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
                {
                    return Ok(false);
                }
            } else if value
                .chars()
                .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
            {
                return Ok(false);
            }
        }

        Err("must contain only alphanumeric characters, dashes, or underscores".into())
    }
}

pub struct AlphaNum {
    only_ascii: bool,
}

impl ParseValidationRule for AlphaNum {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        let only_ascii = rule.first().is_some_and(|s| s == "ascii");

        Ok(Box::new(AlphaNum { only_ascii }))
    }
}

impl ValidateRule for AlphaNum {
    fn label(&self) -> &'static str {
        "alpha_num"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if self.only_ascii {
                if value.chars().all(|c| c.is_ascii_alphanumeric()) {
                    return Ok(false);
                }
            } else if value.chars().all(|c| c.is_alphanumeric()) {
                return Ok(false);
            }
        }

        Err("must contain only alphanumeric characters".into())
    }
}

pub struct Ascii;

impl ParseValidationRule for Ascii {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Ascii))
    }
}

impl ValidateRule for Ascii {
    fn label(&self) -> &'static str {
        "ascii"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.is_ascii()
        {
            return Ok(false);
        }

        Err("must contain only ASCII characters".into())
    }
}

pub struct Between {
    min: f64,
    max: f64,
}

impl ParseValidationRule for Between {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 2 {
            return Err("between requires two numeric values".into());
        }

        let min = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid minimum value"))?;
        let max = rule[1]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid maximum value"))?;

        Ok(Box::new(Between { min, max }))
    }
}

impl ValidateRule for Between {
    fn label(&self) -> &'static str {
        "between"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num >= self.min && num <= self.max {
                    return Ok(false);
                }
            } else if value.len() >= self.min as usize && value.len() <= self.max as usize {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must be between {} and {}",
            self.min,
            self.max
        ))
    }
}

pub struct Boolean;

impl ParseValidationRule for Boolean {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Boolean))
    }
}

impl ValidateRule for Boolean {
    fn label(&self) -> &'static str {
        "boolean"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        match data.data.get(key).copied() {
            Some("true") | Some("1") | Some("yes") | Some("on") | Some("false") | Some("0")
            | Some("no") | Some("off") => Ok(false),
            _ => Err("must be a boolean (true/false, 1/0, yes/no, on/off)".into()),
        }
    }
}

pub struct Confirmed;

impl ParseValidationRule for Confirmed {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Confirmed))
    }
}

impl ValidateRule for Confirmed {
    fn label(&self) -> &'static str {
        "confirmed"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        let confirm_key = format!("{}{}", key, "_confirmation");
        if let Some(value) = data.data.get(key)
            && let Some(confirm_value) = data.data.get(confirm_key.as_str())
            && value == confirm_value
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "does not match confirmation field '{confirm_key}'"
        ))
    }
}

pub struct Date;

impl ParseValidationRule for Date {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Date))
    }
}

impl ValidateRule for Date {
    fn label(&self) -> &'static str {
        "date"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.parse::<chrono::NaiveDate>().is_ok()
        {
            return Ok(false);
        }

        Err("must be a valid date".into())
    }
}

pub struct DateFormat {
    format: compact_str::CompactString,
}

impl ParseValidationRule for DateFormat {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("date_format requires a format string".into());
        }

        let format = rule[0].clone();
        Ok(Box::new(DateFormat { format }))
    }
}

impl ValidateRule for DateFormat {
    fn label(&self) -> &'static str {
        "date_format"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && chrono::NaiveDate::parse_from_str(value, &self.format).is_ok()
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must match the format '{}'",
            self.format
        ))
    }
}

pub struct Declined;

impl ParseValidationRule for Declined {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Declined))
    }
}

impl ValidateRule for Declined {
    fn label(&self) -> &'static str {
        "declined"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        match data.data.get(key).copied() {
            Some("false") | Some("0") | Some("no") | Some("off") => Ok(false),
            _ => Err("value must be 'false', '0', 'no', or 'off'".into()),
        }
    }
}

pub struct DeclinedIf {
    keys: Vec<(compact_str::CompactString, compact_str::CompactString)>,
}

impl ParseValidationRule for DeclinedIf {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() < 2 {
            return Err("declined_if requires a key and value to check".into());
        }

        let mut keys = Vec::new();
        for i in (0..rule.len()).step_by(2) {
            if i + 1 < rule.len() {
                keys.push((rule[i].clone(), rule[i + 1].clone()));
            } else {
                return Err("declined_if requires an even number of arguments".into());
            }
        }

        Ok(Box::new(DeclinedIf { keys }))
    }
}

impl ValidateRule for DeclinedIf {
    fn label(&self) -> &'static str {
        "declined_if"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        for (check_key, check_value) in &self.keys {
            if let Some(value) = data.data.get(check_key.as_str())
                && value == check_value
            {
                match data.data.get(key).copied() {
                    Some("false") | Some("0") | Some("no") | Some("off") => return Ok(false),
                    _ => {
                        return Err("must be 'false', '0', 'no', or 'off'".into());
                    }
                }
            }
        }

        Ok(false)
    }
}

pub struct Different {
    other_key: compact_str::CompactString,
}

impl ParseValidationRule for Different {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("different requires one key to compare against".into());
        }

        Ok(Box::new(Different {
            other_key: rule[0].clone(),
        }))
    }
}

impl ValidateRule for Different {
    fn label(&self) -> &'static str {
        "different"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && let Some(other_value) = data.data.get(self.other_key.as_str())
            && value != other_value
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must be different from '{}'",
            self.other_key
        ))
    }
}

pub struct Digits {
    length: usize,
}

impl ParseValidationRule for Digits {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("digits requires one numeric value for length".into());
        }

        let length = rule[0]
            .parse::<usize>()
            .map_err(|_| compact_str::CompactString::const_new("invalid length value"))?;

        Ok(Box::new(Digits { length }))
    }
}

impl ValidateRule for Digits {
    fn label(&self) -> &'static str {
        "digits"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.chars().all(|c| c.is_ascii_digit())
            && value.len() == self.length
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must contain exactly {} digits",
            self.length
        ))
    }
}

pub struct DigitsBetween {
    minimum: usize,
    maximum: usize,
}

impl ParseValidationRule for DigitsBetween {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 2 {
            return Err("digits_between requires two numeric values".into());
        }

        let minimum = rule[0]
            .parse::<usize>()
            .map_err(|_| compact_str::CompactString::const_new("invalid minimum value"))?;
        let maximum = rule[1]
            .parse::<usize>()
            .map_err(|_| compact_str::CompactString::const_new("invalid maximum value"))?;

        Ok(Box::new(DigitsBetween { minimum, maximum }))
    }
}

impl ValidateRule for DigitsBetween {
    fn label(&self) -> &'static str {
        "digits_between"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.chars().all(|c| c.is_ascii_digit())
        {
            let len = value.len();
            if len >= self.minimum && len <= self.maximum {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must contain between {} and {} digits",
            self.minimum,
            self.maximum
        ))
    }
}

pub struct DoesntStartWith {
    prefixes: Vec<compact_str::CompactString>,
}

impl ParseValidationRule for DoesntStartWith {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("doesnt_start_with requires at least one prefix".into());
        }

        Ok(Box::new(DoesntStartWith {
            prefixes: rule.to_vec(),
        }))
    }
}

impl ValidateRule for DoesntStartWith {
    fn label(&self) -> &'static str {
        "doesnt_start_with"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            for prefix in &self.prefixes {
                if value.starts_with(&**prefix) {
                    return Err(compact_str::format_compact!(
                        "must not start with '{prefix}'"
                    ));
                }
            }
        }

        Ok(false)
    }
}

pub struct DoesntEndWith {
    suffixes: Vec<compact_str::CompactString>,
}

impl ParseValidationRule for DoesntEndWith {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("doesnt_end_with requires at least one suffix".into());
        }

        Ok(Box::new(DoesntEndWith {
            suffixes: rule.to_vec(),
        }))
    }
}

impl ValidateRule for DoesntEndWith {
    fn label(&self) -> &'static str {
        "doesnt_end_with"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            for suffix in &self.suffixes {
                if value.ends_with(&**suffix) {
                    return Err(compact_str::format_compact!("must not end with '{suffix}'"));
                }
            }
        }

        Ok(false)
    }
}

pub struct EndsWith {
    suffixes: Vec<compact_str::CompactString>,
}

impl ParseValidationRule for EndsWith {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("ends_with requires at least one suffix".into());
        }

        Ok(Box::new(EndsWith {
            suffixes: rule.to_vec(),
        }))
    }
}

impl ValidateRule for EndsWith {
    fn label(&self) -> &'static str {
        "ends_with"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            for suffix in &self.suffixes {
                if value.ends_with(&**suffix) {
                    return Err(compact_str::format_compact!("must not end with '{suffix}'"));
                }
            }
        }

        Ok(false)
    }
}

pub struct Gt {
    value: f64,
}

impl ParseValidationRule for Gt {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("gt requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for gt"))?;

        Ok(Box::new(Gt { value }))
    }
}

impl ValidateRule for Gt {
    fn label(&self) -> &'static str {
        "gt"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num > self.value {
                    return Ok(false);
                }
            } else if value.len() > self.value as usize {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must be greater than {}",
            self.value
        ))
    }
}

pub struct Gte {
    value: f64,
}

impl ParseValidationRule for Gte {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("gte requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for gte"))?;

        Ok(Box::new(Gte { value }))
    }
}

impl ValidateRule for Gte {
    fn label(&self) -> &'static str {
        "gte"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num >= self.value {
                    return Ok(false);
                }
            } else if value.len() >= self.value as usize {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must be greater than or equal to {}",
            self.value
        ))
    }
}

pub struct HexColor;

impl ParseValidationRule for HexColor {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(HexColor))
    }
}

impl ValidateRule for HexColor {
    fn label(&self) -> &'static str {
        "hex_color"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.starts_with('#')
            && value.len() == 7
            && value[1..].chars().all(|c| c.is_ascii_hexdigit())
        {
            return Ok(false);
        }

        Err("must be a valid hex color code".into())
    }
}

pub struct In {
    options: Vec<compact_str::CompactString>,
}

impl ParseValidationRule for In {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("in requires at least one option".into());
        }

        Ok(Box::new(In {
            options: rule.to_vec(),
        }))
    }
}

impl ValidateRule for In {
    fn label(&self) -> &'static str {
        "in"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key).copied()
            && self.options.iter().any(|option| option == value)
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must be one of: {}",
            self.options.join(", ")
        ))
    }
}

pub struct Integer;

impl ParseValidationRule for Integer {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Integer))
    }
}

impl ValidateRule for Integer {
    fn label(&self) -> &'static str {
        "integer"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.parse::<i64>().is_ok()
        {
            return Ok(false);
        }

        Err("must be a valid integer".into())
    }
}

pub struct Ip;

impl ParseValidationRule for Ip {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Ip))
    }
}

impl ValidateRule for Ip {
    fn label(&self) -> &'static str {
        "ip"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.parse::<std::net::IpAddr>().is_ok()
        {
            return Ok(false);
        }

        Err("must be a valid IP address".into())
    }
}

pub struct Ipv4;

impl ParseValidationRule for Ipv4 {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Ipv4))
    }
}

impl ValidateRule for Ipv4 {
    fn label(&self) -> &'static str {
        "ipv4"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.parse::<std::net::Ipv4Addr>().is_ok()
        {
            return Ok(false);
        }

        Err("must be a valid IPv4 address".into())
    }
}

pub struct Ipv6;

impl ParseValidationRule for Ipv6 {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Ipv6))
    }
}

impl ValidateRule for Ipv6 {
    fn label(&self) -> &'static str {
        "ipv6"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.parse::<std::net::Ipv6Addr>().is_ok()
        {
            return Ok(false);
        }

        Err("must be a valid IPv6 address".into())
    }
}

pub struct Json;

impl ParseValidationRule for Json {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Json))
    }
}

impl ValidateRule for Json {
    fn label(&self) -> &'static str {
        "json"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && serde_json::from_str::<serde_json::Value>(value).is_ok()
        {
            return Ok(false);
        }

        Err("must be valid JSON".into())
    }
}

pub struct Lt {
    value: f64,
}

impl ParseValidationRule for Lt {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("lt requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for lt"))?;

        Ok(Box::new(Lt { value }))
    }
}

impl ValidateRule for Lt {
    fn label(&self) -> &'static str {
        "lt"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num < self.value {
                    return Ok(false);
                }
            } else if value.len() < self.value as usize {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must be less than {}",
            self.value
        ))
    }
}

pub struct Lte {
    value: f64,
}

impl ParseValidationRule for Lte {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("lte requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for lte"))?;

        Ok(Box::new(Lte { value }))
    }
}

impl ValidateRule for Lte {
    fn label(&self) -> &'static str {
        "lte"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num <= self.value {
                    return Ok(false);
                }
            } else if value.len() <= self.value as usize {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must be less than or equal to {}",
            self.value
        ))
    }
}

pub struct Lowercase;

impl ParseValidationRule for Lowercase {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Lowercase))
    }
}

impl ValidateRule for Lowercase {
    fn label(&self) -> &'static str {
        "lowercase"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.chars().all(|c| c.is_lowercase())
        {
            return Ok(false);
        }

        Err("must be lowercase".into())
    }
}

pub struct MacAddress;

impl ParseValidationRule for MacAddress {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(MacAddress))
    }
}

impl ValidateRule for MacAddress {
    fn label(&self) -> &'static str {
        "mac_address"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            let parts: Vec<&str> = value.split(':').collect();
            if parts.len() == 6
                && parts
                    .iter()
                    .all(|part| part.len() == 2 && part.chars().all(|c| c.is_ascii_hexdigit()))
            {
                return Ok(false);
            }
        }

        Err("must be a valid MAC address".into())
    }
}

pub struct Max {
    value: f64,
}

impl ParseValidationRule for Max {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("max requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for max"))?;

        Ok(Box::new(Max { value }))
    }
}

impl ValidateRule for Max {
    fn label(&self) -> &'static str {
        "max"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if !data.has_rule(key, "string")
                && let Ok(num) = value.parse::<f64>()
            {
                if num <= self.value {
                    return Ok(false);
                }
            } else if value.len() <= self.value as usize {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must be less than or equal to {}",
            self.value
        ))
    }
}

pub struct MaxDigits {
    value: usize,
}

impl ParseValidationRule for MaxDigits {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("max_digits requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<usize>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for max_digits"))?;

        Ok(Box::new(MaxDigits { value }))
    }
}

impl ValidateRule for MaxDigits {
    fn label(&self) -> &'static str {
        "max_digits"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.chars().all(|c| c.is_ascii_digit())
            && value.len() <= self.value
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must contain at most {} digits",
            self.value
        ))
    }
}

pub struct Min {
    value: f64,
}

impl ParseValidationRule for Min {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("min requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for min"))?;

        Ok(Box::new(Min { value }))
    }
}

impl ValidateRule for Min {
    fn label(&self) -> &'static str {
        "min"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if !data.has_rule(key, "string")
                && let Ok(num) = value.parse::<f64>()
            {
                if num >= self.value {
                    return Ok(false);
                }
            } else if value.len() >= self.value as usize {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must be greater than or equal to {}",
            self.value
        ))
    }
}

pub struct MinDigits {
    value: usize,
}

impl ParseValidationRule for MinDigits {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("min_digits requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<usize>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for min_digits"))?;

        Ok(Box::new(MinDigits { value }))
    }
}

impl ValidateRule for MinDigits {
    fn label(&self) -> &'static str {
        "min_digits"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.chars().all(|c| c.is_ascii_digit())
            && value.len() >= self.value
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must contain at least {} digits",
            self.value
        ))
    }
}

pub struct MultipleOf {
    value: f64,
}

impl ParseValidationRule for MultipleOf {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("multiple_of requires one numeric value".into());
        }

        let value = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for multiple_of"))?;

        Ok(Box::new(MultipleOf { value }))
    }
}

impl ValidateRule for MultipleOf {
    fn label(&self) -> &'static str {
        "multiple_of"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && let Ok(num) = value.parse::<f64>()
            && num % self.value == 0.0
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must be a multiple of {}",
            self.value
        ))
    }
}

pub struct NotIn {
    options: Vec<compact_str::CompactString>,
}

impl ParseValidationRule for NotIn {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("not_in requires at least one option".into());
        }

        Ok(Box::new(NotIn {
            options: rule.to_vec(),
        }))
    }
}

impl ValidateRule for NotIn {
    fn label(&self) -> &'static str {
        "not_in"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key).copied()
            && !self.options.iter().any(|option| option == value)
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must not be one of: {}",
            self.options.join(", ")
        ))
    }
}

pub struct NotRegex {
    pattern: regex::Regex,
}

impl ParseValidationRule for NotRegex {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("not_regex requires a regex pattern".into());
        }

        let pattern = rule[0].trim_matches('/').to_string();
        let regex = regex::Regex::new(&pattern)
            .map_err(|_| compact_str::CompactString::const_new("invalid regex pattern"))?;

        Ok(Box::new(NotRegex { pattern: regex }))
    }
}

impl ValidateRule for NotRegex {
    fn label(&self) -> &'static str {
        "not_regex"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && !self.pattern.is_match(value)
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must not match the regex pattern '{}'",
            self.pattern
        ))
    }
}

pub struct Nullable;

impl ParseValidationRule for Nullable {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Nullable))
    }
}

impl ValidateRule for Nullable {
    fn label(&self) -> &'static str {
        "nullable"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key).copied()
            && (value.is_empty() || value == "null")
        {
            return Ok(true);
        }

        Ok(false)
    }
}

pub struct Numeric;

impl ParseValidationRule for Numeric {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Numeric))
    }
}

impl ValidateRule for Numeric {
    fn label(&self) -> &'static str {
        "numeric"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value
                .chars()
                .all(|c| c.is_ascii_digit() || c == '.' || c == '-' || c == '+')
        {
            return Ok(false);
        }

        Err("must be a valid numeric value".into())
    }
}

pub struct Regex {
    pattern: regex::Regex,
}

impl ParseValidationRule for Regex {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("regex requires a regex pattern".into());
        }

        let pattern = rule[0].trim_matches('/').to_string();
        let regex = regex::Regex::new(&pattern)
            .map_err(|_| compact_str::CompactString::const_new("invalid regex pattern"))?;

        Ok(Box::new(Regex { pattern: regex }))
    }
}

impl ValidateRule for Regex {
    fn label(&self) -> &'static str {
        "regex"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && self.pattern.is_match(value)
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must match the regex pattern '{}'",
            self.pattern
        ))
    }
}

pub struct Required;

impl ParseValidationRule for Required {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Required))
    }
}

impl ValidateRule for Required {
    fn label(&self) -> &'static str {
        "required"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && !value.is_empty()
        {
            return Ok(false);
        }

        Err("is required and cannot be empty".into())
    }
}

pub struct RequiredIf {
    keys: Vec<(compact_str::CompactString, compact_str::CompactString)>,
}

impl ParseValidationRule for RequiredIf {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() < 2 {
            return Err("required_if requires a key and value to check".into());
        }

        let mut keys = Vec::new();
        for i in (0..rule.len()).step_by(2) {
            if i + 1 < rule.len() {
                keys.push((rule[i].clone(), rule[i + 1].clone()));
            } else {
                return Err("required_if requires an even number of arguments".into());
            }
        }

        Ok(Box::new(RequiredIf { keys }))
    }
}

impl ValidateRule for RequiredIf {
    fn label(&self) -> &'static str {
        "required_if"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        for (check_key, check_value) in &self.keys {
            if let Some(value) = data.data.get(check_key.as_str()).copied()
                && value == check_value
            {
                if let Some(field_value) = data.data.get(key)
                    && !field_value.is_empty()
                {
                    return Ok(false);
                }

                return Err(compact_str::format_compact!(
                    "is required when '{check_key}' is '{check_value}'"
                ));
            }
        }

        Ok(true)
    }
}

pub struct RequiredIfAccepted {
    other_key: compact_str::CompactString,
}

impl ParseValidationRule for RequiredIfAccepted {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("required_if_accepted requires one key to check".into());
        }

        Ok(Box::new(RequiredIfAccepted {
            other_key: rule[0].clone(),
        }))
    }
}

impl ValidateRule for RequiredIfAccepted {
    fn label(&self) -> &'static str {
        "required_if_accepted"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(self.other_key.as_str()).copied()
            && (value == "true" || value == "1" || value == "yes" || value == "on")
        {
            if let Some(field_value) = data.data.get(key)
                && !field_value.is_empty()
            {
                return Ok(false);
            }

            return Err(compact_str::format_compact!(
                "is required when '{}' is accepted",
                self.other_key
            ));
        }

        Ok(true)
    }
}

pub struct RequiredIfDeclined {
    other_key: compact_str::CompactString,
}

impl ParseValidationRule for RequiredIfDeclined {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("required_if_declined requires one key to check".into());
        }

        Ok(Box::new(RequiredIfDeclined {
            other_key: rule[0].clone(),
        }))
    }
}

impl ValidateRule for RequiredIfDeclined {
    fn label(&self) -> &'static str {
        "required_if_declined"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(self.other_key.as_str()).copied()
            && (value == "false" || value == "0" || value == "no" || value == "off")
        {
            if let Some(field_value) = data.data.get(key)
                && !field_value.is_empty()
            {
                return Ok(false);
            }

            return Err(compact_str::format_compact!(
                "is required when '{}' is declined",
                self.other_key
            ));
        }

        Ok(true)
    }
}

pub struct Same {
    other_key: compact_str::CompactString,
}

impl ParseValidationRule for Same {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("same requires one key to compare against".into());
        }

        Ok(Box::new(Same {
            other_key: rule[0].clone(),
        }))
    }
}

impl ValidateRule for Same {
    fn label(&self) -> &'static str {
        "same"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && let Some(other_value) = data.data.get(self.other_key.as_str())
            && value == other_value
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must be the same as '{}'",
            self.other_key
        ))
    }
}

pub struct Size {
    size: f64,
}

impl ParseValidationRule for Size {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.len() != 1 {
            return Err("size requires one numeric value".into());
        }

        let size = rule[0]
            .parse::<f64>()
            .map_err(|_| compact_str::CompactString::const_new("invalid value for size"))?;

        Ok(Box::new(Size { size }))
    }
}

impl ValidateRule for Size {
    fn label(&self) -> &'static str {
        "size"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            if let Ok(num) = value.parse::<f64>() {
                if num == self.size {
                    return Ok(false);
                }
            } else if value.len() == self.size as usize {
                return Ok(false);
            }
        }

        Err(compact_str::format_compact!(
            "must be equal to {}",
            self.size
        ))
    }
}

pub struct StartsWith {
    prefixes: Vec<compact_str::CompactString>,
}

impl ParseValidationRule for StartsWith {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        if rule.is_empty() {
            return Err("starts_with requires at least one prefix".into());
        }

        Ok(Box::new(StartsWith {
            prefixes: rule.to_vec(),
        }))
    }
}

impl ValidateRule for StartsWith {
    fn label(&self) -> &'static str {
        "starts_with"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key) {
            for prefix in &self.prefixes {
                if value.starts_with(&**prefix) {
                    return Ok(false);
                }
            }
        }

        Err(compact_str::format_compact!(
            "must start with one of: {}",
            self.prefixes.join(", ")
        ))
    }
}

pub struct StringRule;

impl ParseValidationRule for StringRule {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(StringRule))
    }
}

impl ValidateRule for StringRule {
    fn label(&self) -> &'static str {
        "string"
    }

    fn validate(&self, _key: &str, _data: &Validator) -> Result<bool, compact_str::CompactString> {
        Ok(false)
    }
}

pub struct Timezone;

impl ParseValidationRule for Timezone {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Timezone))
    }
}

impl ValidateRule for Timezone {
    fn label(&self) -> &'static str {
        "timezone"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key).copied()
            && (value.parse::<chrono::FixedOffset>().is_ok() || value == "UTC")
        {
            return Ok(false);
        }

        Err("must be a valid timezone".into())
    }
}

pub struct Uppercase;

impl ParseValidationRule for Uppercase {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Uppercase))
    }
}

impl ValidateRule for Uppercase {
    fn label(&self) -> &'static str {
        "uppercase"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && value.chars().all(|c| c.is_uppercase())
        {
            return Ok(false);
        }

        Err("must be uppercase".into())
    }
}

pub struct Url {
    protocols: Vec<compact_str::CompactString>,
}

impl ParseValidationRule for Url {
    fn parse_rule(
        rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Url {
            protocols: rule.to_vec(),
        }))
    }
}

impl ValidateRule for Url {
    fn label(&self) -> &'static str {
        "url"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && let Ok(url) = reqwest::Url::parse(value)
            && (self.protocols.is_empty() || self.protocols.contains(&url.scheme().into()))
        {
            return Ok(false);
        }

        Err(compact_str::format_compact!(
            "must be a valid URL with one of the following protocols: {}",
            self.protocols.join(", ")
        ))
    }
}

pub struct Uuid;

impl ParseValidationRule for Uuid {
    fn parse_rule(
        _rule: &[compact_str::CompactString],
    ) -> Result<Box<dyn ValidateRule>, compact_str::CompactString> {
        Ok(Box::new(Uuid))
    }
}

impl ValidateRule for Uuid {
    fn label(&self) -> &'static str {
        "uuid"
    }

    fn validate(&self, key: &str, data: &Validator) -> Result<bool, compact_str::CompactString> {
        if let Some(value) = data.data.get(key)
            && uuid::Uuid::parse_str(value).is_ok()
        {
            return Ok(false);
        }

        Err("must be a valid UUID".into())
    }
}
