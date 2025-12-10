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
          <Group>
            <Button loading={loading} disabled={!form.isValid()} onClick={doUpdate}>
              Update Account
            </Button>
          </Group>
        </Stack>
      </Card>
    </Grid.Col>
  );
}
