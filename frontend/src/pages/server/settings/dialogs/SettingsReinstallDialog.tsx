import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useState } from 'react';

type Props = DialogProps & {
  onReinstall: (truncate: boolean) => void;
};

export default ({ onReinstall, open, onClose }: Props) => {
  const [truncate, setTruncate] = useState(false);

  return (
    <Dialog title={'Reinstall Server'} onClose={onClose} open={open} hideCloseIcon>
      <div className={'mt-4'}>
        <Input.Switch
          label={'Do you want to empty the filesystem of this server before reinstallation?'}
          name={'truncate'}
          defaultChecked={truncate}
          onChange={(e) => setTruncate(e.target.checked)}
        />
      </div>

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Red} onClick={() => onReinstall(truncate)}>
          Reinstall
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
