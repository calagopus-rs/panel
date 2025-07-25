import { httpErrorToHuman } from '@/api/axios';
import deleteSession from '@/api/me/sessions/deleteSession';
import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog } from '@/elements/dialog';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { faSignOut } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

export default ({ session }: { session: UserSession }) => {
  const { addToast } = useToast();
  const { removeSession } = useUserStore();

  const [open, setOpen] = useState(false);

  const submit = () => {
    deleteSession(session.id)
      .then(() => {
        addToast('Session signed out.', 'success');
        setOpen(false);
        removeSession(session);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Sign Out'} onClose={() => setOpen(false)} open={open}>
        <p>Signing out will invalidate the session.</p>

        <Dialog.Footer>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button style={Button.Styles.Red} onClick={submit}>
            Sign Out
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button style={Button.Styles.Red} size={Button.Sizes.Small} onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faSignOut} />
      </Button>
    </>
  );
};
