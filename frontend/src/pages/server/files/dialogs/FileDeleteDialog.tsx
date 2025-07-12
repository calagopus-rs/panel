import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog, DialogProps } from '@/elements/dialog';

type Props = DialogProps & {
  file: DirectoryEntry;
  onDelete: () => void;
};

export default ({ file, onDelete, open, onClose }: Props) => {
  return (
    <Dialog title="Delete File" onClose={onClose} open={open}>
      <p>
        You will not be able to recover the contents of <Code>{file.name}</Code> once deleted.
      </p>

      <Dialog.Footer>
        <Button style={Button.Styles.Red} onClick={onDelete}>
          Delete
        </Button>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
