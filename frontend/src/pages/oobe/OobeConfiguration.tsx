import { faAddressCard, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import getSettings from '@/api/admin/settings/getSettings';
import updateApplicationSettings from '@/api/admin/settings/updateApplicationSettings';
import { httpErrorToHuman } from '@/api/axios';
import AlertError from '@/elements/alerts/AlertError';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { OobeComponentProps } from '@/routers/OobeRouter';
import { oobeConfigurationSchema } from '@/lib/schemas/oobe';

export default function OobeConfiguration({ onNext }: OobeComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof oobeConfigurationSchema>>({
    initialValues: {
      applicationName: '',
      applicationUrl: '',
      applicationTelemetry: true,
      applicationRegistration: true,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(oobeConfigurationSchema),
  });

  useEffect(() => {
    setLoading(true);

    getSettings()
      .then((settings) => {
        form.setValues({
          applicationName: settings.app.name,
          applicationUrl: settings.app.url,
          applicationTelemetry: settings.app.telemetryEnabled,
          applicationRegistration: settings.app.registrationEnabled,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async () => {
    setLoading(true);

    updateApplicationSettings({
      name: form.values.applicationName,
      url: form.values.applicationUrl,
      telemetryEnabled: form.values.applicationTelemetry,
      registrationEnabled: form.values.applicationRegistration,
    })
      .then(() => {
        onNext();
      })
      .catch((msg) => {
        setError(httpErrorToHuman(msg));
      })
      .finally(() => setLoading(false));
  };

  return (
    <Stack gap='lg' py='md'>
      <Title order={2} mb='xs'>
        Application Settings
      </Title>

      {error && <AlertError error={error} setError={setError} />}

      <Stack gap='md'>
        <TextInput
          label='Application Name'
          placeholder='Calagopus'
          leftSection={<FontAwesomeIcon icon={faAddressCard} size='sm' />}
          required
          {...form.getInputProps('applicationName')}
        />

        <TextInput
          label='Application URL'
          placeholder='https://calagop.us'
          leftSection={<FontAwesomeIcon icon={faGlobe} size='sm' />}
          required
          {...form.getInputProps('applicationUrl')}
        />

        <Switch
          label='Enable Telemetry'
          description='Allow Calagopus to collect limited and anonymous usage data to help improve the application.'
          checked={form.values.applicationTelemetry}
          onChange={(e) => form.setFieldValue('applicationTelemetry', e.target.checked)}
        />

        <Switch
          label='Enable Registration'
          description='Allow new users to register their own account.'
          checked={form.values.applicationRegistration}
          onChange={(e) => form.setFieldValue('applicationRegistration', e.target.checked)}
        />

        <Group justify='flex-end' mt='xl'>
          <Button disabled={!form.isValid()} loading={loading} onClick={onSubmit}>
            Update Settings & Continue
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
}
