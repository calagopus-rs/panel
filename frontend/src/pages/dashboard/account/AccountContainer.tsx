import { Grid, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import updateAccount from '@/api/me/account/updateAccount';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { dashboardAccountSchema } from '@/lib/schemas/dashboard.ts';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useGlobalStore } from '@/stores/global';

export default function AccountContainer() {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();
  const { languages } = useGlobalStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof dashboardAccountSchema>>({
    initialValues: {
      username: '',
      nameFirst: '',
      nameLast: '',
      language: '',
      toastPosition: 'top_left',
      startOnGroupedServers: true,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(dashboardAccountSchema),
  });

  useEffect(() => {
    if (user) {
      form.setValues({
        username: user.username,
        nameFirst: user.nameFirst,
        nameLast: user.nameLast,
        language: user.language,
        toastPosition: user.toastPosition,
        startOnGroupedServers: user.startOnGroupedServers,
      });
    }
  }, [user]);

  const doUpdate = () => {
    setLoading(true);

    updateAccount(form.values)
      .then(() => {
        addToast('Account updated.', 'success');

        setUser({
          ...user!,
          ...form.values,
        });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <Title order={2} c='white'>
          Account
        </Title>
        <form onSubmit={form.onSubmit(() => doUpdate())}>
          <Stack className='mt-4'>
            <Group grow>
              <TextInput
                withAsterisk
                label='First Name'
                placeholder='First Name'
                autoComplete='given-name'
                {...form.getInputProps('nameFirst')}
              />
              <TextInput
                withAsterisk
                label='Last Name'
                placeholder='Last Name'
                autoComplete='family-name'
                {...form.getInputProps('nameLast')}
              />
            </Group>
            <Group grow>
              <TextInput
                withAsterisk
                label='Username'
                placeholder='Username'
                autoComplete='username'
                {...form.getInputProps('username')}
              />
              <Select
                withAsterisk
                label='Language'
                placeholder='Language'
                data={languages.map((language) => ({
                  label: new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language,
                  value: language,
                }))}
                searchable
                {...form.getInputProps('language')}
              />
            </Group>
            <Group grow>
              <Select
                withAsterisk
                label='Toast Position'
                placeholder='Toast Position'
                data={[
                  {
                    label: 'Top Left',
                    value: 'top_left',
                  },
                  {
                    label: 'Top Center',
                    value: 'top_center',
                  },
                  {
                    label: 'Top Right',
                    value: 'top_right',
                  },
                  {
                    label: 'Bottom Left',
                    value: 'bottom_left',
                  },
                  {
                    label: 'Bottom Center',
                    value: 'bottom_center',
                  },
                  {
                    label: 'Bottom Right',
                    value: 'bottom_right',
                  },
                ]}
                {...form.getInputProps('toastPosition')}
              />
              <Switch
                label='Start on the Grouped Servers page'
                checked={form.values.startOnGroupedServers}
                onChange={(e) => form.setFieldValue('startOnGroupedServers', e.target.checked)}
              />
            </Group>
            <Group>
              <Button type='submit' disabled={!form.isValid()} loading={loading}>
                Update Account
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Grid.Col>
  );
}
