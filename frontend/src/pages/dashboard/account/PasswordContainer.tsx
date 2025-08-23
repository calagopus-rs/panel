import { httpErrorToHuman } from '@/api/axios';
import updatePassword from '@/api/me/account/updatePassword';
import NewButton from '@/elements/button/NewButton';
import TextInput from '@/elements/inputnew/TextInput';
import { useToast } from '@/providers/ToastProvider';
import { Grid, Group, Title } from '@mantine/core';
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

      <TextInput
        label={'Current Password'}
        placeholder={'Current Password'}
        type={'password'}
        onChange={(e) => setCurrentPassword(e.target.value)}
        mt={'sm'}
      />

      <TextInput
        label={'New Password'}
        placeholder={'New Password'}
        type={'password'}
        onChange={(e) => setNewPassword(e.target.value)}
        mt={'sm'}
      />

      <TextInput
        label={'Confirm New Password'}
        placeholder={'Confirm New Password'}
        type={'password'}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <NewButton
          disabled={!currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
          onClick={doUpdate}
        >
          Update Password
        </NewButton>
      </Group>
    </Grid.Col>
  );
};
