import { Grid, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import updateAccount from '@/api/me/account/updateAccount';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import TextInput from '@/elements/input/TextInput';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import Select from '@/elements/input/Select';
import { useGlobalStore } from '@/stores/global';

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-zA-Z0-9_]+$/),
  nameFirst: z.string().min(2).max(255),
  nameLast: z.string().min(2).max(255),
  language: z.string(),
});

export default function AccountContainer() {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();
  const { languages } = useGlobalStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      username: '',
      nameFirst: '',
      nameLast: '',
      language: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
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
            <TextInput withAsterisk label='First Name' placeholder='First Name' {...form.getInputProps('nameFirst')} />
            <TextInput withAsterisk label='Last Name' placeholder='Last Name' {...form.getInputProps('nameLast')} />
          </Group>
          <Group grow>
            <TextInput withAsterisk label='Username' placeholder='Username' {...form.getInputProps('username')} />
            <Select
              withAsterisk
              label='Language'
              placeholder='Language'
              data={languages}
              searchable
              allowDeselect
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
