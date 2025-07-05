import { httpErrorToHuman } from '@/api/axios';
import updateEmail from '@/api/me/updateEmail';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';

export default () => {
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleUpdate = () => {
    updateEmail(email, password)
      .then(() => {
        addToast('Email updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <div className="bg-gray-700/50 rounded-md p-4">
      <h1 className="text-4xl font-bold text-white">Update Password</h1>

      <div className="mt-4">
        <Input.Label htmlFor={'newEmail'}>New Email</Input.Label>
        <Input.Text id={'newEmail'} placeholder="New Email" type="email" onChange={e => setEmail(e.target.value)} />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor={'currentPassword'}>Current Password</Input.Label>
        <Input.Text
          id={'currentPassword'}
          placeholder="Current Password"
          type="password"
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button disabled={!password} onClick={handleUpdate}>
          Update Email
        </Button>
      </div>
    </div>
  );
};
