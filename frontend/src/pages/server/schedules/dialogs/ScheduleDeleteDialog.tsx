import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';

type Props = DialogProps & {
  onDeleted: () => void;
};

export default ({ onDeleted, open, onClose }: Props) => {
  const submit = () => {
    onDeleted();
    onClose();
  };

  return (
    <Dialog title={'Confirm Schedule Deletion'} onClose={onClose} open={open}>
      <p>All tasks will be removed and any running processes will be terminated.</p>
      <Dialog.Footer>
        <Button style={Button.Styles.Red} onClick={submit}>
          Delete
        </Button>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
