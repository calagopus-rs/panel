import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useState } from 'react';

type Props = DialogProps & {
  databaseName: string;
  onDeleted: () => void;
};

export default ({ databaseName, onDeleted, open, onClose }: Props) => {
  const [enteredName, setEnteredName] = useState('');

  const submit = () => {
    onDeleted();
    onClose();
  };

  return (
    <Dialog title={'Confirm Database Deletion'} onClose={onClose} open={open}>
      <p>
        Deleting a database is a permanent action, it cannot be undone. This will permanently delete the
        <Code>{databaseName}</Code> database and remove all associated data.
      </p>
      <label htmlFor={'databaseName'} className={'block mt-3'}>
        Database Name
      </label>
      <Input.Text
        id={'databaseName'}
        name={'databaseName'}
        placeholder={'Enter the name of the database to delete.'}
        autoFocus
        onChange={e => setEnteredName(e.target.value)}
      />
      <Dialog.Footer>
        <Button style={Button.Styles.Red} onClick={submit} disabled={databaseName !== enteredName}>
          Delete
        </Button>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
