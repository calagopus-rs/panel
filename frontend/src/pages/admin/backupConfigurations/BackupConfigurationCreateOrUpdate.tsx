import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createBackupConfiguration from '@/api/admin/backup-configurations/createBackupConfiguration';
import deleteBackupConfiguration from '@/api/admin/backup-configurations/deleteBackupConfiguration';
import updateBackupConfiguration from '@/api/admin/backup-configurations/updateBackupConfiguration';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Select from '@/elements/input/Select';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { backupDiskLabelMapping } from '@/lib/enums';
import {
  adminBackupConfigurationResticSchema,
  adminBackupConfigurationS3Schema,
  adminBackupConfigurationSchema,
} from '@/lib/schemas/admin/backupConfigurations';
import BackupRestic from '@/pages/admin/backupConfigurations/forms/BackupRestic';
import BackupS3 from '@/pages/admin/backupConfigurations/forms/BackupS3';
import { useResourceForm } from '@/plugins/useResourceForm';

export default function BackupConfigurationCreateOrUpdate({
  contextBackupConfiguration,
}: {
  contextBackupConfiguration?: BackupConfiguration;
}) {
  const [openModal, setOpenModal] = useState<'delete' | null>(null);

  const form = useForm<z.infer<typeof adminBackupConfigurationSchema>>({
    initialValues: {
      name: '',
      description: null,
      backupDisk: 'local',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminBackupConfigurationSchema),
  });

  const backupConfigS3Form = useForm<z.infer<typeof adminBackupConfigurationS3Schema>>({
    initialValues: {
      accessKey: '',
      secretKey: '',
      bucket: '',
      region: '',
      endpoint: '',
      pathStyle: true,
      partSize: 0,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminBackupConfigurationS3Schema),
  });

  const backupConfigResticForm = useForm<z.infer<typeof adminBackupConfigurationResticSchema>>({
    initialValues: {
      repository: '',
      retryLockSeconds: 0,
      environment: {},
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminBackupConfigurationResticSchema),
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<
    z.infer<typeof adminBackupConfigurationSchema>,
    BackupConfiguration
  >({
    form,
    createFn: () =>
      createBackupConfiguration({
        ...form.values,
        backupConfigs: { s3: backupConfigS3Form.values, restic: backupConfigResticForm.values },
      }),
    updateFn: () =>
      updateBackupConfiguration(contextBackupConfiguration!.uuid, {
        ...form.values,
        backupConfigs: { s3: backupConfigS3Form.values, restic: backupConfigResticForm.values },
      }),
    deleteFn: () => deleteBackupConfiguration(contextBackupConfiguration!.uuid),
    doUpdate: !!contextBackupConfiguration,
    basePath: '/admin/backup-configurations',
    resourceName: 'Backup configuration',
  });

  useEffect(() => {
    if (contextBackupConfiguration) {
      form.setValues({
        name: contextBackupConfiguration.name,
        description: contextBackupConfiguration.description,
        backupDisk: contextBackupConfiguration.backupDisk,
      });
      backupConfigS3Form.setValues(contextBackupConfiguration.backupConfigs.s3);
      backupConfigResticForm.setValues(contextBackupConfiguration.backupConfigs.restic);
    }
  }, [contextBackupConfiguration]);

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Backup Configuration Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{contextBackupConfiguration ? 'Update' : 'Create'} Backup Configuration</Title>

        <Group grow>
          <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
          <Select
            withAsterisk
            label='Backup Disk'
            placeholder='Backup Disk'
            data={Object.entries(backupDiskLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
            {...form.getInputProps('backupDisk')}
          />
        </Group>
        <Group grow align='start'>
          <TextArea label='Description' placeholder='Description' rows={3} {...form.getInputProps('description')} />
        </Group>
        <Group>
          <Button
            onClick={() => doCreateOrUpdate(false)}
            disabled={
              !form.isValid() ||
              ((form.values.backupDisk === 's3' || backupConfigS3Form.isDirty()) && !backupConfigS3Form.isValid()) ||
              ((form.values.backupDisk === 'restic' || backupConfigResticForm.isDirty()) &&
                !backupConfigResticForm.isValid())
            }
            loading={loading}
          >
            Save
          </Button>
          {!contextBackupConfiguration && (
            <Button
              onClick={() => doCreateOrUpdate(true)}
              disabled={
                !form.isValid() ||
                ((form.values.backupDisk === 's3' || backupConfigS3Form.isDirty()) && !backupConfigS3Form.isValid()) ||
                ((form.values.backupDisk === 'restic' || backupConfigResticForm.isDirty()) &&
                  !backupConfigResticForm.isValid())
              }
              loading={loading}
            >
              Save & Stay
            </Button>
          )}
          {contextBackupConfiguration && (
            <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
        {(form.values.backupDisk === 's3' || backupConfigS3Form.isDirty()) && <BackupS3 form={backupConfigS3Form} />}
        {(form.values.backupDisk === 'restic' || backupConfigResticForm.isDirty()) && (
          <BackupRestic form={backupConfigResticForm} />
        )}
      </Stack>
    </>
  );
}
