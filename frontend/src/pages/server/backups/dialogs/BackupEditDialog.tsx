import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useState } from 'react';

type Props = DialogProps & {
  backup: ServerBackup;
  onUpdate: (name: string, locked: boolean) => void;
};

export default ({ backup, onUpdate, open, onClose }: Props) => {
  const [name, setName] = useState(backup.name);
  const [locked, setLocked] = useState<boolean>(backup.isLocked);

  return (
    <Dialog title={'Create Backup'} onClose={onClose} open={open} hideCloseIcon>
      <div className={'mt-4'}>
        <Input.Label htmlFor={'name'}>Name</Input.Label>
        <Input.Text id={'name'} name={'name'} value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className={'mt-4'}>
        <Input.Switch
          description={'Locked'}
          name={'locked'}
          defaultChecked={locked}
          onChange={(e) => setLocked(e.target.checked)}
        />
      </div>

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Green} onClick={() => onUpdate(name, locked)} disabled={!name}>
          Edit
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
