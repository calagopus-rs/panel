import { httpErrorToHuman } from '@/api/axios';
import deleteFiles from '@/api/server/files/deleteFiles';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  files: DirectoryEntry[];
};

export default ({ files, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server, browsingDirectory, browsingEntries, setBrowsingEntries, setSelectedFiles } = useServerStore();

  const [loading, setLoading] = useState(false);

  const doDelete = () => {
    load(true, setLoading);

    deleteFiles(
      server.uuid,
      browsingDirectory,
      files.map((f) => f.name),
    )
      .then(() => {
        addToast('Files have been deleted.', 'success');
        onClose();
        setSelectedFiles([]);
        setBrowsingEntries({
          ...browsingEntries,
          data: browsingEntries.data.filter((f) => !files.find((s) => s.name === f.name)),
        });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };
  return (
    <Modal title={'Delete File'} onClose={onClose} opened={opened}>
      {files.length === 1 ? (
        <p>
          You will not be able to recover the contents of <Code>{files[0].name}</Code> once deleted.
        </p>
      ) : (
        <>
          <p>You will not be able to recover the contents of the following files once deleted.</p>
          <Code block className={'mt-1'}>
            <ul>
              {files.map((file) => (
                <li key={file.name}>
                  <span>{file.name}</span>
                </li>
              ))}
            </ul>
          </Code>
        </>
      )}

      <Group mt={'md'}>
        <Button color={'red'} onClick={doDelete} loading={loading}>
          Delete
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
