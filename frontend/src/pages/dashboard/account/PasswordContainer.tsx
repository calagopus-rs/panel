import { httpErrorToHuman } from '@/api/axios';
import updatePassword from '@/api/me/account/updatePassword';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import { useToast } from '@/providers/ToastProvider';
import { Grid, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';

export default () => {
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const doUpdate = () => {
    updatePassword(currentPassword, newPassword)
      .then(() => {
        addToast('Password updated.', 'success');

        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Title order={2} c={'white'}>
        Password
      </Title>

      <Stack className={'mt-4'}>
        <TextInput
          withAsterisk
          label={'Current Password'}
          placeholder={'Current Password'}
          type={'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <TextInput
          withAsterisk
          label={'New Password'}
          placeholder={'New Password'}
          type={'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <TextInput
          withAsterisk
          label={'Confirm New Password'}
          placeholder={'Confirm New Password'}
          type={'password'}
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />

        <Group>
          <Button
            disabled={!currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
            onClick={doUpdate}
          >
            Update Password
          </Button>
        </Group>
      </Stack>
    </Grid.Col>
  );
};
