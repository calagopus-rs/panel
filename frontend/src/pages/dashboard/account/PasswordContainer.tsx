import { httpErrorToHuman } from '@/api/axios';
import updatePassword from '@/api/me/account/updatePassword';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';

export default () => {
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleUpdate = () => {
    updatePassword(currentPassword, newPassword)
      .then(() => {
        addToast('Password updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <div className={'bg-gray-700/50 rounded-md p-4 h-fit'}>
      <h1 className={'text-4xl font-bold text-white'}>Update Password</h1>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'currentPassword'}>Current Password</Input.Label>
        <Input.Text
          id={'currentPassword'}
          placeholder={'Current Password'}
          type={'password'}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'newPassword'}>New Password</Input.Label>
        <Input.Text
          id={'newPassword'}
          placeholder={'New Password'}
          type={'password'}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'confirmNewPassword'}>Confirm New Password</Input.Label>
        <Input.Text
          id={'confirmNewPassword'}
          placeholder={'Confirm New Password'}
          type={'password'}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />
      </div>

      <div className={'mt-4 flex justify-end'}>
        <Button
          disabled={!currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
          onClick={handleUpdate}
        >
          Update Password
        </Button>
      </div>
    </div>
  );
};
