import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { SettingContainer } from './AdminSettings';
import { useAdminStore } from '@/stores/admin';

export default () => {
  const { addToast } = useToast();
  const { mail } = useAdminStore(state => state.settings);

  // const [email, setEmail] = useState(user.email);
  // const [password, setPassword] = useState('');

  const handleUpdate = () => {
    // updateEmail(email, password)
    //   .then(() => {
    //     addToast('Email updated.', 'success');
    //   })
    //   .catch(msg => {
    //     addToast(httpErrorToHuman(msg), 'error');
    //   });
  };

  return (
    <SettingContainer title={'Email Settings'}>
      {/* <div className="mt-4">
        <Input.Label htmlFor={'newEmail'}>New Email</Input.Label>
        <Input.Text
          id={'newEmail'}
          placeholder="New Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor={'currentPassword'}>Current Password</Input.Label>
        <Input.Text
          id={'currentPassword'}
          placeholder="Current Password"
          type="password"
          onChange={e => setPassword(e.target.value)}
        />
      </div> */}

      <div className="mt-4 flex justify-end">
        <Button onClick={handleUpdate}>Update Email Settings</Button>
      </div>
    </SettingContainer>
  );
};
