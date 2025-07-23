import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { permissionStringToNumber } from '@/lib/files';
import { useState, useEffect } from 'react';

type Props = DialogProps & {
  file: DirectoryEntry;
  onChange: (perms: number) => void;
};

export default ({ file, onChange, open, onClose }: Props) => {
  const [permissions, setPermissions] = useState({
    owner: { read: false, write: false, execute: false },
    group: { read: false, write: false, execute: false },
    other: { read: false, write: false, execute: false },
  });

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

  const handleSave = () => {
    const newPermissions = getOctalValue();
    onChange(newPermissions);
  };

  const PermissionGroup = ({ title, category, perms }) => (
    <div className={'rounded-lg p-4 bg-gray-500'}>
      <h3 className={'font-semibold mb-3 text-gray-100'}>{title}</h3>
      <div className={'space-y-2'}>
        {Object.entries(perms).map(([type, value]: [string, boolean]) => (
          <label key={type} className={'flex items-center space-x-2 cursor-pointer'}>
            <input
              type={'checkbox'}
              checked={value}
              onChange={() => togglePermission(category, type)}
              className={'w-4 h-4 text-blue-600 rounded focus:ring-blue-500'}
            />
            <span className={'text-sm capitalize'}>{type}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog title={'File Permissions'} onClose={onClose} open={open}>
      <div className={'mb-6 p-4 bg-gray-500 rounded-lg'}>
        <div className={'flex items-center space-x-4 text-lg font-mono'}>
          <span className={'text-gray-100'}>Symbolic:</span>
          <span className={'bg-gray-500 px-3 py-1 rounded border font-bold text-blue-300'}>
            {getPermissionString()}
          </span>
        </div>
        <div className={'flex items-center space-x-4 text-lg font-mono mt-2'}>
          <span className={'text-gray-100'}>Octal:</span>
          <span className={'bg-gray-500 px-3 py-1 rounded border font-bold text-green-300'}>{getOctalValue()}</span>
        </div>
      </div>

      <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
        <PermissionGroup title={'Owner'} category={'owner'} perms={permissions.owner} />
        <PermissionGroup title={'Group'} category={'group'} perms={permissions.group} />
        <PermissionGroup title={'Other'} category={'other'} perms={permissions.other} />
      </div>

      <div className={'mt-6 p-4 bg-gray-500 rounded-lg'}>
        <h3 className={'font-semibold mb-2'}>Permission Breakdown:</h3>
        <div className={'text-sm space-y-1'}>
          <div>
            <strong>r</strong> - Read permission (4)
          </div>
          <div>
            <strong>w</strong> - Write permission (2)
          </div>
          <div>
            <strong>x</strong> - Execute permission (1)
          </div>
        </div>
      </div>

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </Dialog.Footer>
    </Dialog>
  );
};
