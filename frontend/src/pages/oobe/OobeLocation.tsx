import { faAddressCard, faFloppyDisk, faRainbow } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import createBackupConfiguration from '@/api/admin/backup-configurations/createBackupConfiguration';
import createLocation from '@/api/admin/locations/createLocation';
import { httpErrorToHuman } from '@/api/axios';
import AlertError from '@/elements/alerts/AlertError';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import { backupDiskLabelMapping } from '@/lib/enums';
import BackupRestic from '@/pages/admin/locations/forms/BackupRestic';
import BackupS3 from '@/pages/admin/locations/forms/BackupS3';

interface OobeLocationProps {
  onNext?: () => void;
}

interface LocationFormValues {
  locationName: string;
  backupName: string;
  backupDisk: BackupDisk;
  backupConfigs: BackupDiskConfigurations;
}

export default function OobeLocation({ onNext }: OobeLocationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<LocationFormValues>({
    initialValues: {
      locationName: '',
      backupName: '',
      backupDisk: 'local',
      backupConfigs: { s3: null, restic: null },
    },
    validateInputOnBlur: true,
    validate: {
      locationName: (value) => {
        if (!value) return 'Location name is required';
        if (value.length < 3) return 'Location name must be at least 3 characters';
        if (value.length > 255) return 'Location name must not exceed 255 characters';
        return null;
      },
      backupName: (value) => {
        if (!value) return 'Backup configuration name is required';
        if (value.length < 3) return 'Backup configuration name must be at least 3 characters';
        if (value.length > 255) return 'Backup configuration name must not exceed 255 characters';
        return null;
      },
      backupDisk: (value) => {
        if (!value) return 'Backup disk is required';
        return null;
      },
    },
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
          label={'Backup Disk'}
          placeholder={'Backup Disk'}
          leftSection={<FontAwesomeIcon icon={faFloppyDisk} size='sm' />}
          data={Object.entries(backupDiskLabelMapping).map(([value, label]) => ({
            value,
            label,
          }))}
          {...form.getInputProps('backupDisk')}
        />

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

        <Group justify='flex-end' mt='xl'>
          <Button disabled={!form.isValid()} loading={loading} onClick={onSubmit}>
            Create & Continue
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
}
