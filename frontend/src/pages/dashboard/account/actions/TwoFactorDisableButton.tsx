import { httpErrorToHuman } from '@/api/axios';
import disableTwoFactor from '@/api/me/account/disableTwoFactor';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { useEffect, useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { user, setUser } = useUserStore();

  const [open, setOpen] = useState(false);

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!open) {
      setCode('');
      setPassword('');
      return;
    }
  }, [open]);

  const submit = () => {
    disableTwoFactor(code, password)
      .then(() => {
        addToast('Two-factor authentication disabled.', 'success');
        setOpen(false);
        setUser({ ...user!, totpEnabled: false });
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Disable Two-Step Verification'} onClose={() => setOpen(false)} open={open}>
        <p>Disabling two-step verification will make your account less secure.</p>

        <Input.Label htmlFor={'totpCode'}>Code</Input.Label>
        <Input.Text
          id={'code'}
          name={'code'}
          type={'number'}
          placeholder={'000000'}
          value={code}
          onChange={e => setCode(e.target.value)}
        />

        <Input.Label htmlFor={'password'}>Password</Input.Label>
        <Input.Text
          id={'password'}
          name={'password'}
          type={'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <Dialog.Footer>
          <Button style={Button.Styles.Red} onClick={submit} disabled={!password}>
            Disable
          </Button>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button style={Button.Styles.Red} onClick={() => setOpen(true)}>
        Disable Two-Step
      </Button>
    </>
  );
};
