import { httpErrorToHuman } from '@/api/axios';
import deleteSshKey from '@/api/me/ssh/deleteSshKey';
import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog } from '@/elements/dialog';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

export default ({ sshKey }: { sshKey: UserSshKey }) => {
  const { addToast } = useToast();
  const { removeSshKey } = useUserStore();

  const [open, setOpen] = useState(false);

  const submit = () => {
    deleteSshKey(encodeURIComponent(sshKey.fingerprint))
      .then(() => {
        addToast('SSH key deleted.', 'success');
        setOpen(false);
        removeSshKey(sshKey);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Delete API Key'} onClose={() => setOpen(false)} open={open}>
        <p>
          Removing the <Code>{sshKey.name}</Code> SSH key will invalidate its usage across the Panel.
        </p>

        <Dialog.Footer>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button style={Button.Styles.Red} onClick={submit}>
            Delete
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button style={Button.Styles.Red} size={Button.Sizes.Small} onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    </>
  );
};
