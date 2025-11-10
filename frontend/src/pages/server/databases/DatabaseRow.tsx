import { faEye, faLock, faLockOpen, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import getDatabaseSize from '@/api/server/databases/getDatabaseSize';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import CopyOnClick from '@/elements/CopyOnClick';
import Spinner from '@/elements/Spinner';
import { TableData, TableRow } from '@/elements/Table';
import { databaseTypeLabelMapping } from '@/lib/enums';
import { bytesToString } from '@/lib/size';
import { useServerStore } from '@/stores/server';
import DatabaseDeleteModal from './modals/DatabaseDeleteModal';
import DatabaseDetailsModal from './modals/DatabaseDetailsModal';
import DatabaseEditModal from './modals/DatabaseEditModal';

export default function DatabaseRow({ database }: { database: ServerDatabase }) {
  const [openModal, setOpenModal] = useState<'edit' | 'details' | 'delete'>(null);
  const [size, setSize] = useState(0);
  const [sizeLoading, setSizeLoading] = useState(true);
  const server = useServerStore((state) => state.server);
  const host = `${database.host}:${database.port}`;

  useEffect(() => {
    getDatabaseSize(server.uuid, database.uuid)
      .then(setSize)
      .finally(() => setSizeLoading(false));
  }, []);

  return (
    <>
      <DatabaseEditModal database={database} opened={openModal === 'edit'} onClose={() => setOpenModal(null)} />
      <DatabaseDetailsModal database={database} opened={openModal === 'details'} onClose={() => setOpenModal(null)} />
      <DatabaseDeleteModal database={database} opened={openModal === 'delete'} onClose={() => setOpenModal(null)} />

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenModal('edit'), color: 'gray' },
          { icon: faEye, label: 'Details', onClick: () => setOpenModal('details'), color: 'gray' },
          {
            icon: faTrash,
            label: 'Delete',
            disabled: database.isLocked,
            onClick: () => setOpenModal('delete'),
            color: 'red',
          },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <TableData>{database.name}</TableData>

            <TableData>{databaseTypeLabelMapping[database.type]}</TableData>

            <TableData>
              <CopyOnClick content={host}>
                <Code>{host}</Code>
              </CopyOnClick>
            </TableData>

            <TableData>{database.username}</TableData>

            <TableData>{sizeLoading ? <Spinner size={16} /> : bytesToString(size)}</TableData>

            <TableData>
              {database.isLocked ? (
                <FontAwesomeIcon className={'text-green-500'} icon={faLock} />
              ) : (
                <FontAwesomeIcon className={'text-red-500'} icon={faLockOpen} />
              )}
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
