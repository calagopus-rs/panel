import { Grid, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateEmail from '@/api/me/account/updateEmail.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { dashboardEmailSchema } from '@/lib/schemas/dashboard.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { AccountCardProps } from './DashboardAccount.tsx';

export default function EmailContainer({ blurred }: AccountCardProps) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof dashboardEmailSchema>>({
    initialValues: {
      email: '',
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(dashboardEmailSchema),
  });

  useEffect(() => {
    form.setValues({
      email: user?.email,
    });
  }, [user]);

  const doUpdate = () => {
    setLoading(true);

    updateEmail(form.values)
      .then(() => {
        addToast(t('pages.account.account.containers.email.toast.updated', {}), 'success');

        setUser({ ...user!, email: form.values.email });
        form.setFieldValue('password', '');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }} className={blurred ? 'blur-xs pointer-events-none select-none' : ''}>
      <Card h='100%'>
        <Title order={2} c='white'>
          {t('pages.account.account.containers.email.title', {})}
        </Title>
        <form onSubmit={form.onSubmit(() => doUpdate())}>
          <Stack className='mt-4'>
            <TextInput
              withAsterisk
              label={t('pages.account.account.containers.email.form.newEmail', {})}
              placeholder={t('pages.account.account.containers.email.form.newEmail', {})}
              autoComplete='email'
              {...form.getInputProps('email')}
            />
            <PasswordInput
              withAsterisk
              label={t('pages.account.account.containers.email.form.currentPassword', {})}
              placeholder={t('pages.account.account.containers.email.form.currentPassword', {})}
              autoComplete='current-password'
              {...form.getInputProps('password')}
            />
          </Stack>
          <Group className='mt-auto pt-4'>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              {t('common.button.update', {})}
            </Button>
          </Group>
        </form>
      </Card>
    </Grid.Col>
  );
}
