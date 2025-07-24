import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useState } from 'react';

type Props = DialogProps & {
  allocation: ServerAllocation;
  onUpdate: (name: string, locked: boolean) => void;
};

export default ({ allocation, onUpdate, open, onClose }: Props) => {
  const [notes, setNotes] = useState(allocation.notes ?? '');
  const [primary, setPrimary] = useState(allocation.isPrimary);

  return (
    <Dialog title={'Edit Allocation'} onClose={onClose} open={open} hideCloseIcon>
      <div className={'mt-4'}>
        <Input.Label htmlFor={'notes'}>Notes</Input.Label>
        <Input.Textarea id={'notes'} name={'notes'} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className={'mt-4'}>
        <Input.Switch
          description={'Primary'}
          name={'primary'}
          defaultChecked={primary}
          onChange={(e) => setPrimary(e.target.checked)}
        />
      </div>

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Green} onClick={() => onUpdate(notes, primary)}>
          Edit
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
