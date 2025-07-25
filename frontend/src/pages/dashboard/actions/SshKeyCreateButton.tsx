import { httpErrorToHuman } from '@/api/axios';
import createSshKey from '@/api/me/ssh-keys/createSshKey';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { useEffect, useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { addSshKey } = useUserStore();

  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [pubKey, setPubKey] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      setPubKey('');
      return;
    }
  }, [open]);

  const submit = () => {
    createSshKey(name, pubKey)
      .then((key) => {
        addToast('SSH key created.', 'success');
        setOpen(false);
        addSshKey(key);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Create SSH Key'} onClose={() => setOpen(false)} open={open}>
        <Input.Label htmlFor={'name'}>Name</Input.Label>
        <Input.Text id={'name'} name={'name'} value={name} onChange={(e) => setName(e.target.value)} />

        <Input.Label htmlFor={'pubKey'}>Public Key</Input.Label>
        <Input.Text id={'pubKey'} name={'pubKey'} value={pubKey} onChange={(e) => setPubKey(e.target.value)} />

        <Dialog.Footer>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={submit} disabled={!name}>
            Create
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button onClick={() => setOpen(true)}>Create SSH Key</Button>
    </>
  );
};
