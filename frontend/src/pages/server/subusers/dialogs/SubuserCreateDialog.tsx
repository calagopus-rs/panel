import { Button } from '@/elements/button';
import Captcha from '@/elements/Captcha';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useRef, useState } from 'react';

type Props = DialogProps & {
  onCreated: (email: string, permissions: string[], ignoredFiles: string[], captcha: string) => void;
};

export default ({ onCreated, open, onClose }: Props) => {
  const [email, setEmail] = useState('');
  const captchaRef = useRef(null);

  const submit = () => {
    captchaRef.current?.getToken().then(token => {
      onCreated(email, [], [], token);
    });
  };

  return (
    <Dialog title="Create Subuser" onClose={onClose} open={open}>
      <div className="mt-4">
        <Input.Label htmlFor="email">Email</Input.Label>
        <Input.Text
          id="email"
          name="email"
          placeholder="Enter the email that this subuser should be saved as."
          autoFocus
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <Captcha ref={captchaRef} />
      </div>

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Green} onClick={submit}>
          Create
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
