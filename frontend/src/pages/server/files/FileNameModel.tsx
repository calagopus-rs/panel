import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useServerStore } from '@/stores/server';
import { join } from 'pathe';
import { useState } from 'react';

type Props = DialogProps & {
  onFileNamed: (name: string) => void;
};

export default ({ onFileNamed, open, onClose }: Props) => {
  const { directory } = useServerStore(state => state.files);

  const [fileName, setFileName] = useState('');

  const submit = () => {
    onFileNamed(join(directory, fileName));
    onClose();
  };

  return (
    <Dialog title={'Create File'} onClose={onClose} open={open}>
      <Input.Text
        id={'fileName'}
        name={'fileName'}
        placeholder={'Enter the name that this file should be saved as.'}
        autoFocus
        onChange={e => setFileName(e.target.value)}
      />
      <Dialog.Footer>
        <Button style={Button.Styles.Green} onClick={submit}>
          Create
        </Button>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
