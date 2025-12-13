import { Group, Title } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import updateCaptchaSettings from '@/api/admin/settings/updateCaptchaSettings';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import { captchaProviderTypeLabelMapping } from '@/lib/enums';
import {
  adminSettingsCaptchaProviderRecaptchaSchema,
  adminSettingsCaptchaProviderSchema,
  adminSettingsCaptchaProviderTurnstileSchema,
} from '@/lib/schemas/admin/settings';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import CaptchaRecaptcha from './forms/CaptchaRecaptcha';
import CaptchaTurnstile from './forms/CaptchaTurnstile';

export default function CaptchaContainer() {
  const { addToast } = useToast();
  const { captchaProvider } = useAdminStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminSettingsCaptchaProviderSchema>>({
    initialValues: {
      type: 'none',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminSettingsCaptchaProviderSchema),
  });

  useEffect(() => {
    form.setValues({
      ...captchaProvider,
    });
  }, [captchaProvider]);

  const doUpdate = () => {
    setLoading(true);

    updateCaptchaSettings(form.values)
      .then(() => {
        addToast('Captcha settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Title mt='md' order={2}>
        Captcha Settings
      </Title>

      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Select
          label='Provider'
          data={Object.entries(captchaProviderTypeLabelMapping).map(([value, label]) => ({
            value,
            label,
          }))}
          {...form.getInputProps('type')}
        />

        {form.values.type === 'turnstile' ? (
          <CaptchaTurnstile
            form={form as UseFormReturnType<z.infer<typeof adminSettingsCaptchaProviderTurnstileSchema>>}
          />
        ) : form.values.type === 'recaptcha' ? (
          <CaptchaRecaptcha
            form={form as UseFormReturnType<z.infer<typeof adminSettingsCaptchaProviderRecaptchaSchema>>}
          />
        ) : null}

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
        </Group>
      </form>
    </>
  );
}
