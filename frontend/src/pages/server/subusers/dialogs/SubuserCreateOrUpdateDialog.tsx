import { Button } from '@/elements/button';
import Captcha from '@/elements/Captcha';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useRef, useState } from 'react';
import PermissionSelector from '../PermissionSelector';

type Props = DialogProps & {
  subuser?: ServerSubuser;
  onCreate?: (email: string, permissions: string[], ignoredFiles: string[], captcha: string) => void;
  onUpdate?: (permissions: string[], ignoredFiles: string[]) => void;
};

export default ({ subuser, onCreate, onUpdate, open, onClose }: Props) => {
  const [email, setEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set(subuser?.permissions ?? []));
  const [ignoredFiles, setIgnoredFiles] = useState<string[]>(subuser?.ignoredFiles ?? []);
  const captchaRef = useRef(null);

  const submit = () => {
    if (subuser && onUpdate) {
      onUpdate(Array.from(selectedPermissions), ignoredFiles);
      return;
    }

    captchaRef.current?.getToken().then((token) => {
      onCreate(email, Array.from(selectedPermissions), ignoredFiles, token);
    });
  };

  return (
    <Dialog title={subuser ? 'Update Subuser' : 'Create Subuser'} onClose={onClose} open={open} hideCloseIcon>
      {subuser ? (
        <div className={'mt-4'}>
          <Input.Label htmlFor={'username'}>Username</Input.Label>
          <Input.Text id={'username'} name={'username'} disabled value={subuser.user.username} />
        </div>
      ) : (
        <div className={'mt-4'}>
          <Input.Label htmlFor={'email'}>Email</Input.Label>
          <Input.Text
            id={'email'}
            name={'email'}
            placeholder={'Enter the email that this subuser should be saved as.'}
            autoFocus
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}

      <div className={'mt-4'}>
        <Input.Label htmlFor={'permissions'}>Permissions</Input.Label>
        <PermissionSelector selectedPermissions={selectedPermissions} setSelectedPermissions={setSelectedPermissions} />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'ignoredFiles'}>Ignored Files</Input.Label>
        <Input.MultiInput placeholder={'Path or file'} options={ignoredFiles} onChange={setIgnoredFiles} />
      </div>

      {!subuser && (
        <div className={'mt-4'}>
          <Captcha ref={captchaRef} />
        </div>
      )}

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Green} onClick={submit}>
          {subuser ? 'Update' : 'Create'}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
