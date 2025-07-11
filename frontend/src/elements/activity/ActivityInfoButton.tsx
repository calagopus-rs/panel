import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { faInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

export default ({ activity }: { activity: ServerActivity | UserActivity }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog title="Activity Details" onClose={() => setOpen(false)} open={open}>
        <pre className="font-mono bg-gray-800 rounded py-1 px-2 text-sm leading-relaxed overflow-x-scroll whitespace-pre-wrap">
          {JSON.stringify(activity.data, null, 2)}
        </pre>

        <Dialog.Footer>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button style={Button.Styles.Gray} size={Button.Sizes.Small} onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faInfo} />
      </Button>
    </>
  );
};
