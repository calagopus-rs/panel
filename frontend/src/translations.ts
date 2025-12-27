import { DefinedTranslations, defineEnglishItem, defineTranslations } from 'shared';

const extensionTranslations = import.meta.glob?.('../extensions/*/src/translations.ts', { eager: true });

const baseTranslations = defineTranslations({
  items: {
    user: defineEnglishItem('User', 'Users'),
  },
  translations: {
    common: {
      button: {
        create: 'Create',
        add: 'Add',
        save: 'Save',
        saveAndStay: 'Save & Stay',
        delete: 'Delete',
        remove: 'Remove',
        enable: 'Enable',
        disable: 'Disable',
        update: 'Update',
        close: 'Close',
        cancel: 'Cancel',
      },
      input: {
        search: 'Search...',
      },
      form: {
        name: 'Name',
        description: 'Description',
        password: 'Password',
      },
      contextMenu: {
        edit: 'Edit',
        delete: 'Delete',
        remove: 'Remove',
      },
      table: {
        pagination: {
          results: 'Showing {start} to {end} of {total} results.',
          empty: "No items could be found, it's almost like they are hiding.",
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
      },
      unlimited: 'Unlimited',
    },
    pages: {
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
                    content: 'Are you sure you want to delete {group} from your account?',
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
                    'Scan the QR code above using the two-step authentication app of your choice. Then, enter the 6-digit code generated into the field below.',
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
      },
      admin: {},
      server: {},
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
