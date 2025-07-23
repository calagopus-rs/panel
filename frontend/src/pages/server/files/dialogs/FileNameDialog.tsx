import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useState } from 'react';

type Props = DialogProps & {
  onFileName: (name: string) => void;
};

export default ({ onFileName, open, onClose }: Props) => {
  const [fileName, setFileName] = useState('');

  return (
    <Dialog title={'Create File'} onClose={onClose} open={open}>
      <Input.Text
        id={'fileName'}
        name={'fileName'}
        placeholder={'Enter the name that this file should be saved as.'}
        autoFocus
        onChange={(e) => setFileName(e.target.value)}
      />
      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Green} onClick={() => onFileName(fileName)}>
          Create
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
