import {
  faChevronDown,
  faDownload,
  faFileCirclePlus,
  faFileUpload,
  faFolderOpen,
  faFolderPlus,
  faServer,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group } from '@mantine/core';
import { memo } from 'react';
import { createSearchParams, useNavigate } from 'react-router';
import Button from '@/elements/Button.tsx';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu.tsx';

interface FileToolbarProps {
  serverUuidShort: string;
  browsingDirectory: string;
  onSftpDetailsClick: () => void;
  onNewDirectoryClick: () => void;
  onPullFileClick: () => void;
  onFileUploadClick: () => void;
  onFolderUploadClick: () => void;
}

const FileToolbar = memo(function FileToolbar({
  serverUuidShort,
  browsingDirectory,
  onSftpDetailsClick,
  onNewDirectoryClick,
  onPullFileClick,
  onFileUploadClick,
  onFolderUploadClick,
}: FileToolbarProps) {
  const navigate = useNavigate();

  return (
    <Group>
      <Button variant='outline' leftSection={<FontAwesomeIcon icon={faServer} />} onClick={onSftpDetailsClick}>
        SFTP Details
      </Button>
      <ContextMenuProvider>
        <ContextMenu
          items={[
            {
              icon: faFileCirclePlus,
              label: 'File from Editor',
              onClick: () =>
                navigate(
                  `/server/${serverUuidShort}/files/new?${createSearchParams({ directory: browsingDirectory })}`,
                ),
              color: 'gray',
            },
            {
              icon: faFolderPlus,
              label: 'Directory',
              onClick: onNewDirectoryClick,
              color: 'gray',
            },
            {
              icon: faDownload,
              label: 'File from Pull',
              onClick: onPullFileClick,
              color: 'gray',
            },
            {
              icon: faFileUpload,
              label: 'File from Upload',
              onClick: onFileUploadClick,
              color: 'gray',
            },
            {
              icon: faFolderOpen,
              label: 'Directory from Upload',
              onClick: onFolderUploadClick,
              color: 'gray',
            },
          ]}
        >
          {({ openMenu }) => (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                openMenu(rect.left, rect.bottom);
              }}
              color='blue'
              rightSection={<FontAwesomeIcon icon={faChevronDown} />}
            >
              New
            </Button>
          )}
        </ContextMenu>
      </ContextMenuProvider>
    </Group>
  );
});

export default FileToolbar;
