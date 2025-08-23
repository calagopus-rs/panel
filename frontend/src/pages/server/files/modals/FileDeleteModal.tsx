import { httpErrorToHuman } from '@/api/axios';
import deleteFiles from '@/api/server/files/deleteFiles';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';

type Props = ModalProps & {
  files: DirectoryEntry[];
};

export default ({ files, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server, browsingDirectory, browsingEntries, setBrowsingEntries, setSelectedFiles } = useServerStore();

  const doDelete = () => {
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
      });
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
          <Code block>
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
        <Button variant={'red'} onClick={doDelete}>
          Delete
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
