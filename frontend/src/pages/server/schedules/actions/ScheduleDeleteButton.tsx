import deleteSchedule from '@/api/server/schedules/deleteSchedule';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export default ({ schedule }: { schedule?: any }) => {
  const server = useServerStore(state => state.server);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const submit = () => {
    deleteSchedule(server.uuid, schedule.id).then(() => {
      navigate(`/server/${server.uuidShort}/schedules`);
    });
  };

  return (
    <>
      <Dialog title="Confirm Schedule Deletion" onClose={() => setOpen(false)} open={open}>
        <p>All tasks will be removed and any running processes will be terminated.</p>
        <Dialog.Footer>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button style={Button.Styles.Red} onClick={submit}>
            Delete
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button style={Button.Styles.Red} onClick={() => setOpen(true)}>
        Delete
      </Button>
    </>
  );
};
