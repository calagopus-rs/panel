import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useState } from 'react';

type Props = DialogProps & {
  databaseName: string;
  onDelete: () => void;
};

export default ({ databaseName, onDelete, open, onClose }: Props) => {
  const [enteredName, setEnteredName] = useState('');

  return (
    <Dialog title={'Confirm Database Deletion'} onClose={onClose} open={open}>
      <p>
        Deleting a database is a permanent action, it cannot be undone. This will permanently delete the
        <Code>{databaseName}</Code> database and remove all associated data.
      </p>
      <Input.Label htmlFor={'databaseName'}>Database Name</Input.Label>
      <Input.Text
        id={'databaseName'}
        name={'databaseName'}
        placeholder={'Enter the name of the database to delete.'}
        autoFocus
        onChange={(e) => setEnteredName(e.target.value)}
      />
      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Red} onClick={() => onDelete()} disabled={databaseName !== enteredName}>
          Delete
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
