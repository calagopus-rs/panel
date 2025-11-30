import { faAddressCard, faFloppyDisk, faRainbow } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import createBackupConfiguration from '@/api/admin/backup-configurations/createBackupConfiguration';
import createLocation from '@/api/admin/locations/createLocation';
import { httpErrorToHuman } from '@/api/axios';
import AlertError from '@/elements/alerts/AlertError';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import { backupDiskLabelMapping } from '@/lib/enums';
import { OobeComponentProps } from '@/routers/OobeRouter';
import { backupConfigurationSchema } from '@/schemas';
import BackupRestic from '../admin/backupConfigurations/forms/BackupRestic';
import BackupS3 from '../admin/backupConfigurations/forms/BackupS3';

export default function OobeLocation({ onNext, skipFrom }: OobeComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof backupConfigurationSchema>>({
    initialValues: {
      locationName: '',
      backupName: '',
      backupDisk: 'local',
      backupConfigs: {
        s3: {
          accessKey: '',
          secretKey: '',
          bucket: '',
          region: '',
          endpoint: '',
          pathStyle: true,
          partSize: 0,
        },
        restic: {
          repository: '',
          retryLockSeconds: 0,
          environment: {},
        },
      },
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(backupConfigurationSchema),
  });

  const onSubmit = async () => {
    setLoading(true);

    createBackupConfiguration({
      name: form.values.backupName,
      description: null,
      backupDisk: form.values.backupDisk,
      backupConfigs: form.values.backupConfigs,
    })
      .then((backupConfig) => {
        createLocation({
          name: form.values.locationName,
          description: null,
          backupConfigurationUuid: backupConfig.uuid,
        })
          .then(() => {
            onNext();
          })
          .catch((msg) => setError(httpErrorToHuman(msg)))
          .finally(() => setLoading(false));
      })
      .catch((msg) => {
        setError(httpErrorToHuman(msg));
        setLoading(false);
      });
  };

  return (
    <Stack gap='lg' py='md'>
      <Title order={2} mb='xs'>
        Location Configuration
      </Title>

      {error && <AlertError error={error} setError={setError} />}

      <Stack gap='md'>
        <TextInput
          label='Location Name'
          placeholder='My home'
          leftSection={<FontAwesomeIcon icon={faAddressCard} size='sm' />}
          required
          {...form.getInputProps('locationName')}
        />

        <TextInput
          label='Backup Configuration Name'
          placeholder='Unicorn Cloud'
          leftSection={<FontAwesomeIcon icon={faRainbow} size='sm' />}
          required
          {...form.getInputProps('backupName')}
        />

        <Select
          withAsterisk
          label='Backup Disk'
          placeholder='Backup Disk'
          leftSection={<FontAwesomeIcon icon={faFloppyDisk} size='sm' />}
          data={Object.entries(backupDiskLabelMapping).map(([value, label]) => ({
            value,
            label,
          }))}
          {...form.getInputProps('backupDisk')}
        />

        {form.values.backupDisk === 's3' || form.values.backupConfigs?.s3 ? <BackupS3 form={form} /> : null}
        {form.values.backupDisk === 'restic' || form.values.backupConfigs?.restic ? <BackupRestic form={form} /> : null}

        <Group justify='flex-end' mt='xl'>
          <Button variant='outline' onClick={() => skipFrom!('location')}>
            Skip
          </Button>
          <Button disabled={!form.isValid()} loading={loading} onClick={onSubmit}>
            Create & Continue
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
}
