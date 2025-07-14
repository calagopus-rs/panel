import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useServerStore } from '@/stores/server';
import { join } from 'pathe';
import { useState } from 'react';

type Props = DialogProps & {
  onDirectoryNamed: (name: string) => void;
};

export default ({ onDirectoryNamed, open, onClose }: Props) => {
  const { browsingDirectory } = useServerStore();

  const [dirName, setDirName] = useState('');

  const submit = () => {
    onDirectoryNamed(dirName);
  };

  return (
    <Dialog title="Create Directory" onClose={onClose} open={open}>
      <Input.Text
        id="dirName"
        name="dirName"
        placeholder="Enter the name that this directory should be saved as."
        autoFocus
        onChange={e => setDirName(e.target.value)}
      />
      <p className="mt-2 text-sm md:text-base break-all">
        <span className="text-neutral-200">This directory will be created as&nbsp;</span>
        <Code>
          /home/container/
          <span className="text-cyan-200">{join(browsingDirectory, dirName).replace(/^(\.\.\/|\/)+/, '')}</span>
        </Code>
      </p>
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
