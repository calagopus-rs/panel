import { httpErrorToHuman } from '@/api/axios';
import chmodFiles from '@/api/server/files/chmodFiles';
import Badge from '@/elements/Badge';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import Code from '@/elements/Code';
import Checkbox from '@/elements/input/Checkbox';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { permissionStringToNumber } from '@/lib/files';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps, Stack, Title } from '@mantine/core';
import { useState, useEffect } from 'react';

type Props = ModalProps & {
  file: DirectoryEntry;
};

export default ({ file, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server, browsingDirectory } = useServerStore();

  const [permissions, setPermissions] = useState({
    owner: { read: false, write: false, execute: false },
    group: { read: false, write: false, execute: false },
    other: { read: false, write: false, execute: false },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file.mode) {
      const octalValue = permissionStringToNumber(file.mode);
      const octalString = octalValue.toString().padStart(3, '0');

      // Parse octal permissions (e.g., "755" -> [7, 5, 5])
      const [ownerPerms, groupPerms, otherPerms] = octalString.split('').map(Number);

      setPermissions({
        owner: {
          read: (ownerPerms & 4) !== 0,
          write: (ownerPerms & 2) !== 0,
          execute: (ownerPerms & 1) !== 0,
        },
        group: {
          read: (groupPerms & 4) !== 0,
          write: (groupPerms & 2) !== 0,
          execute: (groupPerms & 1) !== 0,
        },
        other: {
          read: (otherPerms & 4) !== 0,
          write: (otherPerms & 2) !== 0,
          execute: (otherPerms & 1) !== 0,
        },
      });
    }
  }, [file.mode]);

  const togglePermission = (category, type) => {
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type],
      },
    }));
  };

  const getPermissionString = () => {
    const { owner, group, other } = permissions;

    const getTriad = (perms) => {
      return (perms.read ? 'r' : '-') + (perms.write ? 'w' : '-') + (perms.execute ? 'x' : '-');
    };

    // Determine file type indicator from original file.mode
    const fileTypeIndicator = file?.mode?.[0] || '-';
    return fileTypeIndicator + getTriad(owner) + getTriad(group) + getTriad(other);
  };

  const getOctalValue = () => {
    const getValue = (perms) => {
      return (perms.read ? 4 : 0) + (perms.write ? 2 : 0) + (perms.execute ? 1 : 0);
    };

    return parseInt(
      getValue(permissions.owner).toString() +
        getValue(permissions.group).toString() +
        getValue(permissions.other).toString(),
    );
  };

  const PermissionGroup = ({ title, category, perms }) => (
    <Card>
      <Title order={3} c={'white'}>
        {title}
      </Title>
      <Stack>
        {Object.entries(perms).map(([type, value]: [string, boolean]) => (
          <Checkbox key={type} label={type} checked={value} onChange={() => togglePermission(category, type)} />
        ))}
      </Stack>
    </Card>
  );

  const doChmod = () => {
    const newPermissions = getOctalValue();

    load(true, setLoading);

    chmodFiles({
      uuid: server.uuid,
      root: browsingDirectory,
      files: [{ file: file.name, mode: newPermissions.toString() }],
    })
      .then(() => {
        onClose();
        addToast('Permissions have been updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'File Permissions'} onClose={onClose} opened={opened}>
      <Card>
        <div className={'flex flex-row justify-between'}>
          <Title order={3} c={'white'}>
            Symbolic:
          </Title>
          <Badge variant={'light'} color={'blue'} size={'xl'} className={'lowercase!'}>
            {getPermissionString()}
          </Badge>
        </div>
        <div className={'mt-2 flex flex-row justify-between'}>
          <Title order={3} c={'white'}>
            Octal:
          </Title>
          <Badge variant={'light'} color={'green'} size={'xl'}>
            {getOctalValue()}
          </Badge>
        </div>
      </Card>

      <Group mt={'md'} grow>
        <PermissionGroup title={'Owner'} category={'owner'} perms={permissions.owner} />
        <PermissionGroup title={'Group'} category={'group'} perms={permissions.group} />
        <PermissionGroup title={'Other'} category={'other'} perms={permissions.other} />
      </Group>

      <Card mt={'md'}>
        <Title order={3} c={'white'}>
          Permission Breakdown
        </Title>
        <div className={'text-sm space-y-1'}>
          <div>
            <Code className={'font-bold'}>r</Code> - Read permission (4)
          </div>
          <div>
            <Code className={'font-bold'}>w</Code> - Write permission (2)
          </div>
          <div>
            <Code className={'font-bold'}>x</Code> - Execute permission (1)
          </div>
        </div>
      </Card>

      <Group mt={'md'}>
        <Button onClick={doChmod} loading={loading}>
          Save
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
