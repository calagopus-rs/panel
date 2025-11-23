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
import BackupRestic from '@/pages/admin/locations/forms/BackupRestic';
import BackupS3 from '@/pages/admin/locations/forms/BackupS3';
import { OobeComponentProps } from '@/routers/OobeRouter';

const schema = z.object({
  locationName: z.string().min(3).max(255),
  backupName: z.string().min(3).max(255),
  backupDisk: z.enum(['local', 's3', 'restic']),
  backupConfigs: z.object({
    s3: z.object({
      accessKey: z.string(),
      secretKey: z.string(),
      bucket: z.string(),
      region: z.string(),
      endpoint: z.string(),
      pathStyle: z.boolean(),
      partSize: z.number().min(0),
    }),
    restic: z.object({
      repository: z.string(),
      retryLockSeconds: z.number().min(0),
      environment: z.record(z.string(), z.string()),
    }),
  }),
});

export default function OobeLocation({ onNext, skipFrom }: OobeComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      locationName: '',
      backupName: '',
      backupDisk: 'local',
      backupConfigs: { s3: null, restic: null },
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
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
          <Button variant='outline' onClick={() => skipFrom('location')}>
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
