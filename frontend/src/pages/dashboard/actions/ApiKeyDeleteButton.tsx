import { httpErrorToHuman } from '@/api/axios';
import deleteApiKey from '@/api/me/api/deleteApiKey';
import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog } from '@/elements/dialog';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

export default ({ apiKey }: { apiKey: UserApiKey }) => {
  const { addToast } = useToast();
  const { removeApiKey } = useUserStore();

  const [open, setOpen] = useState(false);

  const submit = () => {
    deleteApiKey(apiKey.keyStart)
      .then(() => {
        addToast('API key deleted.', 'success');
        setOpen(false);
        removeApiKey(apiKey);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title="Delete API Key" onClose={() => setOpen(false)} open={open}>
        <p>Are you sure you want to delete this API key?</p>
        <p>
          All requests using the <Code>{apiKey.keyStart}</Code> key will no longer work.
        </p>

        <Dialog.Footer>
          <Button style={Button.Styles.Red} onClick={submit}>
            Delete
          </Button>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button style={Button.Styles.Red} size={Button.Sizes.Small} onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    </>
  );
};
