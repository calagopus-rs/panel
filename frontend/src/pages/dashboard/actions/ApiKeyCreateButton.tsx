import { httpErrorToHuman } from '@/api/axios';
import createApiKey from '@/api/me/api-keys/createApiKey';
import { Button } from '@/elements/button';
import NewButton from '@/elements/button/NewButton';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { addApiKey } = useUserStore();

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
      .then((key) => {
        addToast('API key created.', 'success');
        setOpen(false);
        addApiKey({ ...key.apiKey, keyStart: key.key });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Create API Key'} onClose={() => setOpen(false)} open={open}>
        <Input.Label htmlFor={'name'}>Name</Input.Label>
        <Input.Text id={'name'} name={'name'} value={name} onChange={(e) => setName(e.target.value)} />

        <Dialog.Footer>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={submit} disabled={!name}>
            Create
          </Button>
        </Dialog.Footer>
      </Dialog>
      <NewButton onClick={() => setOpen(true)} color={'blue'}>
        <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
        Create
      </NewButton>
    </>
  );
};
