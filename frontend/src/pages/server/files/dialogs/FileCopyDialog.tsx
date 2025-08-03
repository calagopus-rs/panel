import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useServerStore } from '@/stores/server';
import { join } from 'pathe';
import { useState } from 'react';

type Props = DialogProps & {
  fileName: string;

  onFileCopy: (name: string) => void;
};

export default ({ fileName, onFileCopy, open, onClose }: Props) => {
  const { browsingDirectory, browsingEntries } = useServerStore();

  const [newFileName, setNewFileName] = useState('');

  const generateNewName = () => {
    const lastDotIndex = fileName.lastIndexOf('.');
    let extension = lastDotIndex > -1 ? fileName.slice(lastDotIndex) : '';
    let baseName = lastDotIndex > -1 ? fileName.slice(0, lastDotIndex) : fileName;

    if (baseName.endsWith('.tar')) {
      extension = '.tar' + extension;
      baseName = baseName.slice(0, -4);
    }

    const lastSlashIndex = fileName.lastIndexOf('/');
    const parent = lastSlashIndex > -1 ? fileName.slice(0, lastSlashIndex + 1) : '';

    let suffix = ' copy';

    for (let i = 0; i <= 50; i++) {
      if (i > 0) {
        suffix = ` copy ${i}`;
      }

      const newName = baseName.concat(suffix, extension);
      const newPath = parent + newName;

      const exists = browsingEntries.data.some((entry) => entry.name === newPath);

      if (!exists) {
        return newName;
      }

      if (i === 50) {
        const timestamp = new Date().toISOString();
        suffix = `copy.${timestamp}`;

        const finalName = baseName.concat(suffix, extension);
        return finalName;
      }
    }

    return baseName.concat(suffix, extension);
  };

  return (
    <Dialog title={'Copy File'} onClose={onClose} open={open}>
      <Input.Text
        id={'fileName'}
        name={'fileName'}
        placeholder={'Enter the name that the copied file should be saved as.'}
        autoFocus
        onChange={(e) => setNewFileName(e.target.value)}
      />
      <p className={'mt-2 text-sm md:text-base break-all'}>
        <span className={'text-neutral-200'}>This file will be created as&nbsp;</span>
        <Code>
          /home/container/
          <span className={'text-cyan-200'}>
            {join(browsingDirectory, newFileName || generateNewName()).replace(/^(\.\.\/|\/)+/, '')}
          </span>
        </Code>
      </p>
      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button style={Button.Styles.Green} onClick={() => onFileCopy(newFileName)}>
          Copy
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
