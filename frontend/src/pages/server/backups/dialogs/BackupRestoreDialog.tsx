import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useState } from 'react';

type Props = DialogProps & {
  onRestore: (truncate: boolean) => void;
};

export default ({ onRestore, open, onClose }: Props) => {
  const [truncate, setTruncate] = useState(false);

  return (
    <Dialog title={'Restore Backup'} onClose={onClose} open={open} hideCloseIcon>
      <div className="mt-4">
        <Input.Switch
          description="Do you want to empty the filesystem of this server before restoring the backup?"
          name="truncate"
          defaultChecked={truncate}
          onChange={e => setTruncate(e.target.checked)}
        />
      </div>

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Red} onClick={() => onRestore(truncate)}>
          Restore
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
