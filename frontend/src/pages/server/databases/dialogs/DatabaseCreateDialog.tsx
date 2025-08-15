import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useState } from 'react';

type Props = DialogProps & {
  onCreate: (name: string) => void;
};

export default ({ onCreate, open, onClose }: Props) => {
  const [name, setName] = useState('');

  return (
    <Dialog title={'Create Database'} onClose={onClose} open={open}>
      <Input.Label htmlFor={'dbName'}>Database Name</Input.Label>
      <Input.Text
        id={'dbName'}
        name={'dbName'}
        placeholder={'A descriptive name for your database.'}
        autoFocus
        onChange={(e) => setName(e.target.value)}
      />

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Green} onClick={() => onCreate(name)} disabled={!name}>
          Create
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
