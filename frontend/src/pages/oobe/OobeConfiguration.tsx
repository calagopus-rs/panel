import { faAddressCard, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import getSettings from '@/api/admin/settings/getSettings.ts';
import updateApplicationSettings from '@/api/admin/settings/updateApplicationSettings.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import AlertError from '@/elements/alerts/AlertError.tsx';
import Button from '@/elements/Button.tsx';
import Select from '@/elements/input/Select.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { oobeConfigurationSchema } from '@/lib/schemas/oobe.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { OobeComponentProps } from '@/routers/OobeRouter.tsx';
import { useGlobalStore } from '@/stores/global.ts';

export default function OobeConfiguration({ onNext }: OobeComponentProps) {
  const { t, setLanguage } = useTranslations();
  const { languages } = useGlobalStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof oobeConfigurationSchema>>({
    initialValues: {
      applicationName: '',
      applicationLanguage: 'en-US',
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
          applicationLanguage: settings.app.language,
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
      language: form.values.applicationLanguage,
      url: form.values.applicationUrl,
      twoFactorRequirement: 'none',
      telemetryEnabled: form.values.applicationTelemetry,
      registrationEnabled: form.values.applicationRegistration,
    })
      .then(() => {
        setLanguage(form.values.applicationLanguage);
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
        {t('pages.oobe.configuration.title', {})}
      </Title>

      {error && <AlertError error={error} setError={setError} />}

      <form onSubmit={form.onSubmit(() => onSubmit())}>
        <Stack gap='md'>
          <TextInput
            label={t('pages.oobe.configuration.form.applicationName', {})}
            placeholder={t('pages.oobe.configuration.form.applicationNamePlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faAddressCard} size='sm' />}
            required
            {...form.getInputProps('applicationName')}
          />

          <Select
            withAsterisk
            label={t('pages.oobe.configuration.form.language', {})}
            placeholder={t('pages.oobe.configuration.form.languagePlaceholder', {})}
            data={languages.map((language) => ({
              label: new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language,
              value: language,
            }))}
            {...form.getInputProps('applicationLanguage')}
          />

          <TextInput
            label={t('pages.oobe.configuration.form.applicationUrl', {})}
            placeholder={t('pages.oobe.configuration.form.applicationUrlPlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faGlobe} size='sm' />}
            required
            {...form.getInputProps('applicationUrl')}
          />

          <Switch
            label={t('pages.oobe.configuration.form.telemetry', {})}
            description={t('pages.oobe.configuration.form.telemetryDescription', {})}
            checked={form.values.applicationTelemetry}
            onChange={(e) => form.setFieldValue('applicationTelemetry', e.target.checked)}
          />

          <Switch
            label={t('pages.oobe.configuration.form.registration', {})}
            description={t('pages.oobe.configuration.form.registrationDescription', {})}
            checked={form.values.applicationRegistration}
            onChange={(e) => form.setFieldValue('applicationRegistration', e.target.checked)}
          />

          <Group justify='flex-end' mt='xl'>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              {t('pages.oobe.configuration.button.submit', {})}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
