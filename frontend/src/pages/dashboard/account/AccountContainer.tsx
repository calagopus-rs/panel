import { httpErrorToHuman } from '@/api/axios';
import updateAccount from '@/api/me/account/updateAccount';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Grid, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const [username, setUsername] = useState(user.username);
  const [nameFirst, setNameFirst] = useState(user.nameFirst);
  const [nameLast, setNameLast] = useState(user.nameLast);

  const doUpdate = () => {
    updateAccount({ username, nameFirst, nameLast })
      .then(() => {
        addToast('Account updated.', 'success');

        setUser({ ...user!, username, nameFirst, nameLast });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Title order={2} c={'white'}>
        Account
      </Title>

      <Stack className={'mt-4'}>
        <TextInput
          withAsterisk
          label={'Username'}
          placeholder={'Username'}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <Group grow>
          <TextInput
            withAsterisk
            label={'First Name'}
            placeholder={'First Name'}
            value={nameFirst}
            onChange={(e) => setNameFirst(e.target.value)}
          />

          <TextInput
            withAsterisk
            label={'Last Name'}
            placeholder={'Last Name'}
            value={nameLast}
            onChange={(e) => setNameLast(e.target.value)}
          />
        </Group>

        <Group>
          <Button disabled={!username || !nameFirst || !nameLast} onClick={doUpdate}>
            Update Account
          </Button>
        </Group>
      </Stack>
    </Grid.Col>
  );
};
