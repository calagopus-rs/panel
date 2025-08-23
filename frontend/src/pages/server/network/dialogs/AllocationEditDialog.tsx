import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import Switch from '@/elements/inputnew/Switch';
import TextArea from '@/elements/inputnew/TextArea';
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
      <TextArea
        label={'Notes'}
        placeholder={'Notes'}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        mt={'sm'}
      />

      <Switch label={'Primary'} checked={primary} onChange={(e) => setPrimary(e.target.checked)} mt={'sm'} />

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
