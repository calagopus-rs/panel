import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog, DialogProps } from '@/elements/dialog';

type Props = DialogProps & {
  files: DirectoryEntry[];
  onDelete: () => void;
};

export default ({ files, onDelete, open, onClose }: Props) => {
  return (
    <Dialog title={'Delete File'} onClose={onClose} open={open}>
      {files.length === 1 ? (
        <p>
          You will not be able to recover the contents of <Code>{files[0].name}</Code> once deleted.
        </p>
      ) : (
        <>
          <p>You will not be able to recover the contents of the following files once deleted.</p>
          <ul
            className={
              'font-mono bg-gray-800 rounded py-1 px-2 text-sm leading-relaxed overflow-x-scroll whitespace-pre-wrap'
            }
          >
            {files.map((file) => (
              <li key={file.name}>
                <span>{file.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Red} onClick={onDelete}>
          Delete
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
