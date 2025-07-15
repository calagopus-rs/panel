import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useServerStore } from '@/stores/server';
import { join } from 'pathe';
import { useState } from 'react';

type Props = DialogProps & {
  onCreate: (name: string, format: ArchiveFormat) => void;
};

export default ({ onCreate, open, onClose }: Props) => {
  const { browsingDirectory } = useServerStore();

  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState<ArchiveFormat>('tar_gz');

  const submit = () => {
    onCreate(fileName, format);
  };

  return (
    <Dialog title="Create Archive" onClose={onClose} open={open}>
      <div className="mt-4">
        <Input.Label htmlFor="fileName">Archive Name</Input.Label>
        <Input.Text
          id="fileName"
          name="fileName"
          placeholder="Enter the name that this archive should be saved as."
          autoFocus
          value={fileName}
          onChange={e => setFileName(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="format">Format</Input.Label>
        <Input.Dropdown
          id="format"
          options={[
            { value: 'tar', label: 'tar' },
            { value: 'tar_gz', label: 'tar.gz' },
            { value: 'tar_xz', label: 'tar.xz' },
            { value: 'tar_bz2', label: 'tar.bz2' },
            { value: 'tar_lz4', label: 'tar.lz4' },
            { value: 'tar_zstd', label: 'tar.zstd' },
            { value: 'zip', label: 'zip' },
          ]}
          selected={format}
          onChange={e => setFormat(e.target.value as ArchiveFormat)}
        />
      </div>

      <p className="mt-2 text-sm md:text-base break-all">
        <span className="text-neutral-200">This archive will be created as&nbsp;</span>
        <Code>
          /home/container/
          <span className="text-cyan-200">{join(browsingDirectory, fileName).replace(/^(\.\.\/|\/)+/, '')}</span>
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
