import { DefinedTranslations, defineEnglishItem, defineTranslations } from 'shared';

const extensionTranslations = import.meta.glob?.('../extensions/*/src/translations.ts', { eager: true });

const baseTranslations = defineTranslations({
  items: {
    user: defineEnglishItem('User', 'Users'),
    sshKey: defineEnglishItem('SSH Key', 'SSH Keys'),
  },
  translations: {
    common: {
      button: {
        create: 'Create',
        add: 'Add',
        save: 'Save',
        saveAndStay: 'Save & Stay',
        edit: 'Edit',
        delete: 'Delete',
        remove: 'Remove',
        enable: 'Enable',
        disable: 'Disable',
        update: 'Update',
        close: 'Close',
        cancel: 'Cancel',
        continue: 'Continue',
        skip: 'Skip',
      },
      input: {
        search: 'Search...',
      },
      form: {
        name: 'Name',
        description: 'Description',
        password: 'Password',
        host: 'Host',
        username: 'Username',
        truncateDirectory: 'Do you want to empty the filesystem of this server before restoring the backup?',
      },
      table: {
        pagination: {
          results: 'Showing {start} to {end} of {total} results.',
          empty: "No items could be found, it's almost like they are hiding.",
        },
        columns: {
          name: 'Name',
          description: 'Description',
          username: 'Username',
          size: 'Size',
          lastUsed: 'Last Used',
          created: 'Created',
          actor: 'Actor',
          event: 'Event',
          ip: 'IP',
          when: 'When',
        },
      },
      server: {
        noAllocation: 'No Allocation',
        state: {
          suspended: 'Suspended',
          restoringBackup: 'Restoring Backup',
          installing: 'Installing',
          InstallFailed: 'Install Failed',
        },
      },
      enum: {
        userToastPosition: {
          topLeft: 'Top Left',
          topCenter: 'Top Center',
          topRight: 'Top Right',
          bottomLeft: 'Bottom Left',
          bottomCenter: 'Bottom Center',
          bottomRight: 'Bottom Right',
        },
        serverState: {
          offline: 'Offline',
          running: 'Running',
          starting: 'Starting',
          stopping: 'Stopping',
        },
        serverAutoStartBehavior: {
          always: 'Always',
          unlessStopped: 'Unless Stopped',
          never: 'Never',
        },
      },
      unlimited: 'Unlimited',
      na: 'N/A',
      yes: 'Yes',
      no: 'No',
      system: 'System',
    },
    pages: {
      oobe: {
        welcome: {
          title: 'Welcome to Calagopus',
          subtitle: "Let's get your game server management system up and running!",
          wizardIntro: 'This setup wizard will guide you through:',
          steps: {
            account: 'Creating your administrator account',
            settings: 'Configuring essential system settings',
            location: 'Setting up your server location',
            node: 'Adding your first node',
            server: 'Deploying your first game server',
          },
          button: {
            start: 'Get Started',
          },
        },
        register: {
          title: 'Create Administrator Account',
          alert: {
            title: 'Security Notice',
            description:
              'Choose a strong password. This account will have complete administrative access to all servers and settings.',
          },
          form: {
            username: 'Username',
            usernamePlaceholder: 'admin',
            email: 'Email Address',
            emailPlaceholder: 'admin@example.com',
            firstName: 'First Name',
            firstNamePlaceholder: 'Alan',
            lastName: 'Last Name',
            lastNamePlaceholder: 'Turing',
            password: 'Password',
            passwordPlaceholder: 'Enter a strong password',
            confirmPassword: 'Confirm Password',
            confirmPasswordPlaceholder: 'Re-enter your password',
          },
          button: {
            create: 'Create Account & Continue',
          },
        },
        login: {
          title: 'Log back in',
          alert: 'You got logged out during the setup process. Please log back in to continue where you left off.',
          form: {
            username: 'Username',
            usernamePlaceholder: 'admin',
            password: 'Password',
            passwordPlaceholder: 'Enter a strong password',
          },
          button: {
            login: 'Log in & Continue',
          },
        },
        location: {
          title: 'Location Configuration',
          form: {
            locationName: 'Location Name',
            locationNamePlaceholder: 'My home',
            backupName: 'Backup Configuration Name',
            backupNamePlaceholder: 'Unicorn Cloud',
            backupDisk: 'Backup Disk',
            backupDiskPlaceholder: 'Backup Disk',
          },
          button: {
            create: 'Create & Continue',
          },
        },
        node: {
          title: 'Node Configuration',
          form: {
            name: 'Name',
            namePlaceholder: 'My Server',
            url: 'URL',
            urlPlaceholder: 'URL',
            urlDescription: 'used for internal communication with the node',
            publicUrl: 'Public URL',
            publicUrlPlaceholder: 'URL',
            publicUrlDescription: 'used for websocket/downloads',
            sftpHost: 'SFTP Host',
            sftpHostPlaceholder: 'SFTP Host',
            sftpPort: 'SFTP Port',
            sftpPortPlaceholder: 'SFTP Port',
            memory: 'Memory',
            disk: 'Disk',
          },
          error: {
            noLocations: 'Something went wrong. No locations were found.',
          },
          button: {
            create: 'Create & Continue',
          },
        },
        configuration: {
          title: 'Application Settings',
          form: {
            applicationName: 'Application Name',
            applicationNamePlaceholder: 'Calagopus',
            language: 'Language',
            languagePlaceholder: 'Language',
            applicationUrl: 'Application URL',
            applicationUrlPlaceholder: 'https://calagop.us',
            telemetry: 'Enable Telemetry',
            telemetryDescription:
              'Allow Calagopus to collect limited and anonymous usage data to help improve the application.',
            registration: 'Enable Registration',
            registrationDescription: 'Allow new users to register their own account.',
          },
          button: {
            submit: 'Update Settings & Continue',
          },
        },
        finished: {
          title: 'Setup Complete!',
          subtitle: 'Your Calagopus panel is ready to use',
          setupTitle: "What We've Set Up",
          items: {
            account: 'Administrator Account',
            configuration: {
              title: 'System Configuration',
              subtitle: 'Panel settings and preferences configured',
            },
            location: 'Location',
            node: 'Node',
          },
          badge: {
            skipped: 'Skipped',
          },
          button: 'Go to Dashboard',
        },
      },
      auth: {},
      account: {
        home: {
          title: 'Servers',
          tooltip: {
            removeFromGroup: 'Remove from Group',
            addToGroup: 'Add to Group',
            noGroups: 'No groups available to add server to',
            noGroup: 'This server is not in any group',
          },
          tabs: {
            groupedServers: {
              title: 'Grouped Servers',
              page: {
                button: {
                  createGroup: 'Create Group',
                },
                modal: {
                  createServerGroup: {
                    title: 'Create Server Group',
                    toast: {
                      created: 'Server group created.',
                    },
                  },
                  editServerGroup: {
                    title: 'Edit Server Group',
                    toast: {
                      updated: 'Server group updated.',
                    },
                  },
                  deleteServerGroup: {
                    title: 'Confirm Server Group Deletion',
                    content: 'Are you sure you want to delete **{group}** from your account?',
                    toast: {
                      deleted: 'Server group deleted.',
                    },
                  },
                },
                noGroups: 'No Groups could be found, time to create one?',
              },
            },
            allServers: {
              title: 'All Servers',
              page: {
                input: {
                  showOtherUsersServers: "Show other user's servers",
                },
                modal: {
                  addToServerGroup: {
                    title: 'Add {server} to Server Group',
                    form: {
                      serverGroup: 'Server Group',
                    },
                  },
                },
              },
            },
          },
          noServers: 'No Servers could be found, time to add one?',
        },
        admin: {
          title: 'Admin',
        },
        account: {
          title: 'Account',
          alert: {
            requireTwoFactor: {
              title: 'Two-Factor Authentication Required',
              description:
                'Two-Factor Authentication is required on your account. Please set it up below to continue using the panel.',
            },
          },
          containers: {
            password: {
              title: 'Password',
              toast: {
                updated: 'Password updated successfully.',
              },
              form: {
                currentPassword: 'Current Password',
                newPassword: 'New Password',
                confirmNewPassword: 'Confirm New Password',
              },
            },
            email: {
              title: 'Email',
              toast: {
                updated: 'Email updated successfully.',
              },
              form: {
                newEmail: 'New Email',
                currentPassword: 'Current Password',
              },
            },
            twoFactor: {
              title: 'Two-Factor Authentication',
              toast: {
                disabled: 'Two-factor authentication disabled successfully.',
                enabled: 'Two-factor authentication enabled successfully. Please copy your recovery codes.',
              },
              modal: {
                disableTwoFactor: {
                  title: 'Disable Two-Factor Authentication',
                  description: 'Disabling two-factor authentication will make your account less secure.',
                  form: {
                    code: 'Authentication Code',
                  },
                },
                setupTwoFactor: {
                  title: 'Setup Two-Factor Authentication',
                  description:
                    "Help protect your account from unauthorized access. You'll be prompted for a verification code each time you sign in.",
                  descriptionQR:
                    'Scan the QR code above using the two-factor authentication app of your choice. Then, enter the 6-digit code generated into the field below.',
                  form: {
                    code: 'Authentication Code',
                  },
                },
                recoveryCodes: {
                  title: 'Recovery Codes',
                  description:
                    'Below are your recovery codes. Store these in a safe place. If you lose access to your authentication device, you can use these codes to regain access to your account.',
                },
              },
              button: {
                disableTwoFactor: 'Disable Two-Factor',
                setupTwoFactor: 'Setup Two-Factor',
              },
              twoFactorEnabled: 'Two-Factor Verification is currently enabled.',
              twoFactorDisabled:
                'You do not currently have two-factor verification enabled on your account. Click the button below to begin configuring it.',
              twoFactorLastUsed: 'Last used: **{date}**',
            },
            account: {
              title: 'Account Details',
              toast: {
                updated: 'Account details updated successfully.',
              },
              form: {
                nameFirst: 'First Name',
                nameLast: 'Last Name',
                username: 'Username',
                language: 'Language',
                toastPosition: 'Toast Position',
                startOnGroupedServers: 'Start on the Grouped Servers page',
              },
            },
            avatar: {
              title: 'Avatar',
              toast: {
                updated: 'Avatar updated successfully.',
                removed: 'Avatar removed successfully.',
              },
              form: {
                avatar: 'Avatar',
              },
            },
          },
        },
        securityKeys: {
          title: 'Security Keys',
          modal: {
            createSecurityKey: {
              title: 'Create Security Key',
              toast: {
                created: 'Security key created successfully.',
                aborted: 'Security key creation aborted.',
              },
            },
            editSecurityKey: {
              title: 'Edit Security Key',
              toast: {
                updated: 'Security key updated successfully.',
              },
            },
            deleteSecurityKey: {
              title: 'Confirm Security Key Deletion',
              content: 'Are you sure you want to delete **{key}** from your account?',
              toast: {
                deleted: 'Security key deleted successfully.',
              },
            },
          },
        },
        sessions: {
          title: 'Sessions',
          table: {
            columns: {
              ip: 'IP',
              thisDevice: 'This Device?',
              userAgent: 'User Agent',
            },
          },
          modal: {
            deleteSession: {
              title: 'Confirm Session Deletion',
              content: 'Are you sure you want to delete the session **{ip}** from your account?',
              toast: {
                deleted: 'Session deleted.',
              },
            },
          },
        },
        sshKeys: {
          title: 'SSH Keys',
          button: {
            import: 'Import',
          },
          table: {
            columns: {
              fingerprint: 'Fingerprint',
            },
          },
          modal: {
            createSshKey: {
              title: 'Create SSH Key',
              toast: {
                created: 'SSH key created.',
              },
              form: {
                publicKey: 'Public Key',
              },
            },
            editSshKey: {
              title: 'Edit SSH Key',
              toast: {
                updated: 'SSH Key updated.',
              },
            },
            importSshKeys: {
              title: 'Import SSH Keys',
              toast: {
                created: '{sshKeys} created.',
              },
              form: {
                provider: 'Provider',
                username: 'Username',
              },
            },
            deleteSshKey: {
              title: 'Confirm SSH Key Deletion',
              content: 'Are you sure you want to delete **{name}** from your account?',
              toast: {
                removed: 'SSH key removed.',
              },
            },
          },
        },
        oauthLinks: {
          title: 'OAuth Links',
          button: {
            connect: 'Connect',
            connectTo: 'Connect to {provider}',
          },
          table: {
            columns: {
              providerName: 'Provider Name',
              identifier: 'Identifier',
            },
          },
          modal: {
            deleteOAuthLink: {
              title: 'Confirm OAuth Link Deletion',
              content: 'Are you sure you want to delete the **{provider}** connection from your account?',
              toast: {
                removed: 'OAuth Link removed.',
              },
            },
          },
        },
        apiKeys: {
          title: 'API Keys',
          table: {
            columns: {
              key: 'Key',
              permissions: 'User / Server / Admin Permissions',
              expires: 'Expires',
            },
          },
          modal: {
            createApiKey: {
              title: 'Create API Key',
              toast: {
                created: 'API key created.',
              },
            },
            updateApiKey: {
              title: 'Update API Key',
              toast: {
                updated: 'API key updated.',
              },
            },
            deleteApiKey: {
              title: 'Confirm API Key Deletion',
              content: 'Are you sure you want to delete **{name}** from your account?',
              toast: {
                removed: 'API key removed.',
              },
            },
          },
          form: {
            allowedIps: 'Allowed IPs',
            allowedIpsPlaceholder: 'e.g. 192.168.1.1, 2001:db8::1',
            userPermissions: 'User Permissions',
            serverPermissions: 'Server Permissions',
            adminPermissions: 'Admin Permissions',
          },
        },
        activity: {
          title: 'Activity',
        },
      },
      admin: {},
      server: {
        viewAdmin: {
          title: 'View admin',
        },
        console: {
          title: 'Console',
          input: {
            placeholder: 'Type a command...',
            ariaLabel: 'Console command input.',
          },
          toast: {
            installCancelled: 'Server install cancelled.',
          },
          notification: {
            restoringBackup: 'Your Server is currently restoring from a backup. Please wait...',
            installing: 'Your Server is currently being installed. Please wait...',
          },
          message: {
            serverMarkedAs: 'Server marked as {state}...',
            transferFailed: 'Transfer has failed.',
            pullingImage: "Your Server is currently pulling it's docker image. Please wait...",
            pulling: 'Pulling',
            extracting: 'Extracting',
            layer: 'Layer',
          },
          details: {
            address: 'Address',
            port: 'Port',
            uptime: 'Uptime',
            cpuLoad: 'CPU Load',
            memoryLoad: 'Memory Load',
            diskUsage: 'Disk Usage',
            networkIn: 'Network (In)',
            networkOut: 'Network (Out)',
            normalizeCpuLoad: 'Normalize CPU Load (shifted to max 100%)',
          },
          power: {
            start: 'Start',
            stop: 'Stop',
            restart: 'Restart',
            kill: 'Kill',
            modal: {
              forceStop: {
                title: 'Forcibly Stop Process',
                content: 'Forcibly stopping a server can lead to data corruption.',
              },
            },
          },
          stats: {
            cpuLoad: 'CPU Load',
            memoryLoad: 'Memory Load',
            network: 'Network',
            inbound: 'Inbound',
            outbound: 'Outbound',
          },
          socketConnected: 'Connected ({ping}ms ping)',
          socketDisconnected: 'Disconnected',
        },
        files: {
          title: 'Files',
        },
        databases: {
          title: 'Databases',
          subtitle: '{current} of {max} maximum databases created.',
          tooltip: {
            limitReached: 'This server is limited to {max} databases.',
          },
          table: {
            columns: {
              type: 'Type',
              address: 'Address',
              locked: 'Locked?',
            },
          },
          button: {
            details: 'Details',
            rotatePassword: 'Rotate Password',
          },
          modal: {
            createDatabase: {
              title: 'Create Database',
              toast: {
                created: 'Database created.',
              },
              form: {
                databaseName: 'Database Name',
                databaseHost: 'Database Host',
                noHostsFound: 'No hosts found',
              },
            },
            editDatabase: {
              title: 'Edit Database',
              toast: {
                updated: 'Database updated.',
              },
              form: {
                locked: 'Locked',
              },
            },
            databaseDetails: {
              title: 'Database connection details',
              toast: {
                passwordRotated: 'Password has been rotated.',
              },
              form: {
                jdbcConnectionString: 'JDBC Connection String',
              },
            },
            deleteDatabase: {
              title: 'Confirm Database Deletion',
              content:
                'Deleting a database is a permanent action, it cannot be undone. This will permanently delete the **{name}** database and remove all associated data.',
              toast: {
                deleted: 'Database deleted.',
              },
            },
          },
        },
        schedules: {
          title: 'Schedules',
        },
        subusers: {
          title: 'Subusers',
          table: {
            columns: {
              twoFactorEnabled: '2FA Enabled',
              permissions: 'Permissions',
              ignoredFiles: 'Ignored Files',
            },
          },
          modal: {
            createSubuser: {
              title: 'Create Subuser',
              toast: {
                created: 'Subuser created.',
              },
              form: {
                email: 'Email',
                emailPlaceholder: 'Enter the email that this subuser should be saved as.',
                permissions: 'Permissions',
                ignoredFiles: 'Ignored Files',
              },
            },
            updateSubuser: {
              title: 'Update Subuser',
              toast: {
                updated: 'Subuser updated.',
              },
            },
            removeSubuser: {
              title: 'Confirm Subuser Removal',
              content: 'Are you sure you want to remove **{username}** from this server?',
              toast: {
                removed: 'Subuser removed.',
              },
            },
          },
        },
        backups: {
          title: 'Backups',
          subtitle: '{current} of {max} maximum backups created.',
          tooltip: {
            limitReached: 'This server is limited to {max} backups.',
          },
          table: {
            columns: {
              checksum: 'Checksum',
              files: 'Files',
              locked: 'Locked?',
            },
          },
          button: {
            browse: 'Browse',
            download: 'Download',
            downloadAs: 'Download as {format}',
            restore: 'Restore',
          },
          toast: {
            downloadStarted: 'Download started.',
            restoringBackup: 'Restoring backup...',
          },
          modal: {
            createBackup: {
              title: 'Create Backup',
              toast: {
                created: 'Backup created.',
              },
              form: {
                ignoredFiles: 'Ignored Files',
              },
            },
            editBackup: {
              title: 'Edit Backup',
              toast: {
                updated: 'Backup updated.',
              },
              form: {
                locked: 'Locked',
              },
            },
            restoreBackup: {
              title: 'Restore Backup',
            },
            deleteBackup: {
              title: 'Confirm Backup Deletion',
              content: 'Are you sure you want to delete **{name}** from this server?',
              toast: {
                deleted: 'Backup deleted.',
              },
            },
          },
        },
        network: {
          title: 'Network',
          subtitle: '{current} of {max} maximum allocations assigned.',
          tooltip: {
            limitReached: 'This server is limited to {max} allocations.',
            primary: 'Primary',
          },
          table: {
            columns: {
              hostname: 'Hostname',
              port: 'Port',
              notes: 'Notes',
            },
          },
          button: {
            setPrimary: 'Set Primary',
            unsetPrimary: 'Unset Primary',
          },
          toast: {
            created: 'Allocation created.',
            updated: 'Allocation updated.',
            removed: 'Allocation removed.',
            setPrimary: 'Allocation set as primary.',
            unsetPrimary: 'Allocation unset as primary.',
          },
          modal: {
            editAllocation: {
              title: 'Edit Allocation',
              form: {
                notes: 'Notes',
              },
            },
            removeAllocation: {
              title: 'Confirm Allocation Removal',
              content: 'Are you sure you want to remove **{allocation}** from this server?',
            },
          },
        },
        startup: {
          title: 'Startup',
          form: {
            startupCommand: 'Startup Command',
            dockerImage: 'Docker Image',
          },
          variables: 'Variables',
          dockerImageDescription:
            'The Docker image used to run this server. This can be changed to use a different image.',
          dockerImageDescriptionCustom:
            'The Docker image used to run this server. This has been set by an administrator and cannot be changed.',
          toast: {
            startupCommandUpdated: 'Startup command updated.',
            dockerImageUpdated: 'Docker image updated.',
            variablesUpdated: 'Variables updated.',
          },
        },
        settings: {
          title: 'Settings',
          rename: {
            title: 'Rename Server',
            form: {
              serverName: 'Server Name',
            },
            toast: {
              renamed: 'Server renamed.',
            },
          },
          timezone: {
            title: 'Timezone',
            form: {
              timezone: 'Timezone',
              system: 'System',
            },
            toast: {
              updated: 'Server timezone updated.',
            },
          },
          autokill: {
            title: 'Auto-Kill',
            form: {
              enabled: 'Enabled',
              secondsUntilAutoKill: 'Seconds until auto-kill',
            },
            toast: {
              updated: 'Server auto-kill updated.',
            },
          },
          autostart: {
            title: 'Auto-Start',
            form: {
              behavior: 'Behavior',
            },
            toast: {
              updated: 'Server auto-start behavior updated.',
            },
          },
          reinstall: {
            title: 'Reinstall Server',
            button: 'Reinstall Server',
            modal: {
              title: 'Reinstall Server',
              button: 'Reinstall',
              toast: {
                reinstalling: 'Reinstalling server...',
              },
            },
          },
        },
        activity: {
          title: 'Activity',
        },
      },
    },
  },
});

for (const [path, translations] of Object.entries(extensionTranslations ?? {})) {
  const identifier = path.split('/')[2];
  if (identifier === 'shared') continue;

  if (
    typeof translations === 'object' &&
    translations &&
    'default' in translations &&
    translations.default instanceof DefinedTranslations
  ) {
    translations.default.namespace = identifier.replaceAll('_', '.');
    baseTranslations.mergeFrom(translations.default);
  } else {
    console.error('Invalid frontend translations', identifier, translations);
  }
}

if (import.meta.env?.DEV) {
  console.debug('Initialized base translations', baseTranslations);
}

export default baseTranslations;
