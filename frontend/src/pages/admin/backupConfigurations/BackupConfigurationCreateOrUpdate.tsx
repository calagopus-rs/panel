import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Group, Title, Divider, Stack } from '@mantine/core';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Select from '@/elements/input/Select';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { backupDiskLabelMapping } from '@/lib/enums';
import updateBackupConfiguration from '@/api/admin/backup-configurations/updateBackupConfiguration';
import createBackupConfiguration from '@/api/admin/backup-configurations/createBackupConfiguration';
import deleteBackupConfiguration from '@/api/admin/backup-configurations/deleteBackupConfiguration';
import TextArea from '@/elements/input/TextArea';
import BackupS3 from '@/pages/admin/locations/forms/BackupS3';
import BackupRestic from '@/pages/admin/locations/forms/BackupRestic';
import { useForm } from '@mantine/form';
import { useResourceForm } from '@/plugins/useResourceForm';

export default ({ contextBackupConfiguration }: { contextBackupConfiguration?: BackupConfiguration }) => {
  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<UpdateBackupConfiguration>({
    initialValues: {
      name: '',
      description: null,
      backupDisk: 'local',
      backupConfigs: { s3: null, restic: null },
    },
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<UpdateBackupConfiguration, BackupConfiguration>({
    form,
    createFn: () => createBackupConfiguration(form.values),
    updateFn: () => updateBackupConfiguration(contextBackupConfiguration?.uuid, form.values),
    deleteFn: () => deleteBackupConfiguration(contextBackupConfiguration?.uuid),
    doUpdate: !!contextBackupConfiguration,
    basePath: '/admin/backup-configurations',
    resourceName: 'Backup configuration',
  });

  useEffect(() => {
    if (contextBackupConfiguration) {
      form.setValues({
        ...contextBackupConfiguration,
      });
    }
  }, [contextBackupConfiguration]);

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Backup Configuration Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Title order={1} mb={'md'}>
        {contextBackupConfiguration ? 'Update' : 'Create'} Backup Configuration
      </Title>
      <Divider />

      <Stack>
        <Group grow>
          <TextInput withAsterisk label={'Name'} placeholder={'Name'} {...form.getInputProps('name')} />
          <Select
            withAsterisk
            label={'Backup Disk'}
            placeholder={'Backup Disk'}
            data={Object.entries(backupDiskLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
            {...form.getInputProps('backupDisk')}
          />
        </Group>

        <Group grow align={'start'}>
          <TextArea label={'Description'} placeholder={'Description'} rows={3} {...form.getInputProps('description')} />
        </Group>

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
            Save
          </Button>
          {!contextBackupConfiguration && (
            <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextBackupConfiguration && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>

        {form.values.backupDisk === 's3' || form.values.backupConfigs?.s3 ? (
          <BackupS3
            backupConfig={
              form.values.backupConfigs?.s3 ?? {
                accessKey: '',
                secretKey: '',
                bucket: '',
                region: '',
                endpoint: '',
                pathStyle: false,
                partSize: 512 * 1024 * 1024,
              }
            }
            setBackupConfigs={(config) => form.setFieldValue('backupConfigs.s3', config)}
          />
        ) : null}
        {form.values.backupDisk === 'restic' || form.values.backupConfigs?.restic ? (
          <BackupRestic
            backupConfig={
              form.values.backupConfigs?.restic ?? {
                repository: '',
                retryLockSeconds: 60,
                environment: {},
              }
            }
            setBackupConfigs={(config) => form.setFieldValue('backupConfigs.restic', config)}
          />
        ) : null}
      </Stack>
    </>
  );
};
