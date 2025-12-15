use lettre::AsyncTransport;
use std::sync::Arc;

pub const MAIL_PASSWORD_RESET: &str = include_str!("../mails/password_reset.html");
pub const MAIL_ACCOUNT_CREATED: &str = include_str!("../mails/account_created.html");

#[derive(Debug)]
enum Transport {
    None,
    Smtp {
        transport: lettre::AsyncSmtpTransport<lettre::Tokio1Executor>,
        from_address: compact_str::CompactString,
        from_name: Option<compact_str::CompactString>,
    },
    Sendmail {
        transport: lettre::AsyncSendmailTransport<lettre::Tokio1Executor>,
        from_address: compact_str::CompactString,
        from_name: Option<compact_str::CompactString>,
    },
    Filesystem {
        transport: lettre::AsyncFileTransport<lettre::Tokio1Executor>,
        from_address: compact_str::CompactString,
        from_name: Option<compact_str::CompactString>,
    },
}

pub struct Mail {
    settings: Arc<super::settings::Settings>,
}

impl Mail {
    pub fn new(settings: Arc<super::settings::Settings>) -> Self {
        Self { settings }
    }

    async fn get_transport(&self) -> Result<Transport, anyhow::Error> {
        let settings = self.settings.get().await;

        match &settings.mail_mode {
            super::settings::MailMode::None => Ok(Transport::None),
            super::settings::MailMode::Smtp {
                host,
                port,
                username,
                password,
                use_tls,
                from_address,
                from_name,
            } => {
                let mut transport =
                    lettre::AsyncSmtpTransport::<lettre::Tokio1Executor>::builder_dangerous(
                        host.as_str(),
                    )
                    .port(*port)
                    .tls(if *use_tls {
                        lettre::transport::smtp::client::Tls::Required(
                            lettre::transport::smtp::client::TlsParametersBuilder::new(
                                host.to_string(),
                            )
                            .build_rustls()
                            .unwrap(),
                        )
                    } else {
                        lettre::transport::smtp::client::Tls::None
                    });

                if let Some(username) = username {
                    transport = transport.credentials(
                        lettre::transport::smtp::authentication::Credentials::new(
                            username.to_string(),
                            password.clone().unwrap_or_default().into(),
                        ),
                    );
                }

                Ok(Transport::Smtp {
                    transport: transport.build(),
                    from_address: from_address.clone(),
                    from_name: from_name.clone(),
                })
            }
            super::settings::MailMode::Sendmail {
                command,
                from_address,
                from_name,
            } => {
                let transport =
                    lettre::AsyncSendmailTransport::<lettre::Tokio1Executor>::new_with_command(
                        command,
                    );

                Ok(Transport::Sendmail {
                    transport,
                    from_address: from_address.clone(),
                    from_name: from_name.clone(),
                })
            }
            super::settings::MailMode::Filesystem {
                path,
                from_address,
                from_name,
            } => {
                let transport = lettre::AsyncFileTransport::<lettre::Tokio1Executor>::new(path);

                Ok(Transport::Filesystem {
                    transport,
                    from_address: from_address.clone(),
                    from_name: from_name.clone(),
                })
            }
        }
    }

    pub async fn send(
        &self,
        destination: compact_str::CompactString,
        subject: compact_str::CompactString,
        body: String,
    ) {
        let transport = match self.get_transport().await {
            Ok(transport) => transport,
            Err(e) => {
                tracing::error!("failed to get mail transport: {:#?}", e);
                return;
            }
        };

        tracing::debug!(
            transport = ?transport,
            destination = ?destination,
            subject = ?subject,
            "sending email"
        );

        tokio::spawn(async move {
            let run = async || -> Result<(), anyhow::Error> {
                match transport {
                    Transport::None => {}
                    Transport::Smtp {
                        transport,
                        from_address,
                        from_name,
                    } => {
                        transport
                            .send(
                                lettre::message::Message::builder()
                                    .subject(subject)
                                    .to(lettre::message::Mailbox::new(None, destination.parse()?))
                                    .from(lettre::message::Mailbox::new(
                                        from_name.map(String::from),
                                        from_address.parse()?,
                                    ))
                                    .header(lettre::message::header::ContentType::TEXT_HTML)
                                    .body(body)?,
                            )
                            .await?;
                    }
                    Transport::Sendmail {
                        transport,
                        from_address,
                        from_name,
                    } => {
                        transport
                            .send(
                                lettre::message::Message::builder()
                                    .subject(subject)
                                    .to(lettre::message::Mailbox::new(None, destination.parse()?))
                                    .from(lettre::message::Mailbox::new(
                                        from_name.map(String::from),
                                        from_address.parse()?,
                                    ))
                                    .header(lettre::message::header::ContentType::TEXT_HTML)
                                    .body(body)?,
                            )
                            .await?;
                    }
                    Transport::Filesystem {
                        transport,
                        from_address,
                        from_name,
                    } => {
                        transport
                            .send(
                                lettre::message::Message::builder()
                                    .subject(subject)
                                    .to(lettre::message::Mailbox::new(None, destination.parse()?))
                                    .from(lettre::message::Mailbox::new(
                                        from_name.map(String::from),
                                        from_address.parse()?,
                                    ))
                                    .header(lettre::message::header::ContentType::TEXT_HTML)
                                    .body(body)?,
                            )
                            .await?;
                    }
                }

                Ok(())
            };

            match run().await {
                Ok(_) => tracing::debug!("email sent successfully"),
                Err(err) => tracing::error!("failed to send email: {:?}", err),
            }
        });
    }
}
