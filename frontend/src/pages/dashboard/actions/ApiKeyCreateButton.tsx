import { httpErrorToHuman } from '@/api/axios';
import createApiKey from '@/api/me/api/createApiKey';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { useEffect, useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { addKey } = useUserStore(state => state.apiKeys);

  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      return;
    }
  }, [open]);

  const submit = () => {
    createApiKey(name)
      .then(key => {
        addToast('API key created.', 'success');
        setOpen(false);
        addKey({ ...key.api_key, keyStart: key.key });
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Create API Key'} onClose={() => setOpen(false)} open={open}>
        <Input.Label htmlFor={'name'}>Name</Input.Label>
        <Input.Text id={'name'} name={'name'} value={name} onChange={e => setName(e.target.value)} />

        <Dialog.Footer>
          <Button onClick={submit} disabled={!name}>
            Create
          </Button>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button onClick={() => setOpen(true)}>Create API Key</Button>
    </>
  );
};
