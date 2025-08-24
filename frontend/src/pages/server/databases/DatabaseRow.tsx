import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import CopyOnClick from '@/elements/CopyOnClick';
import { faEye, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { TableData, TableRow } from '@/elements/Table';
import DatabaseDetailsModal from './modals/DatabaseDetailsModal';
import DatabaseDeleteModal from './modals/DatabaseDeleteModal';
import { bytesToString } from '@/lib/size';
import getDatabaseSize from '@/api/server/databases/getDatabaseSize';
import { useServerStore } from '@/stores/server';
import Spinner from '@/elements/Spinner';

export default ({ database }: { database: ServerDatabase }) => {
  const [openModal, setOpenModal] = useState<'details' | 'delete'>(null);
  const [size, setSize] = useState(0);
  const [sizeLoading, setSizeLoading] = useState(true);
  const { server } = useServerStore();
  const host = `${database.host}:${database.port}`;

  useEffect(() => {
    getDatabaseSize(server.uuid, database.uuid)
      .then(setSize)
      .finally(() => setSizeLoading(false));
  }, []);

  return (
    <>
      <DatabaseDetailsModal database={database} opened={openModal === 'details'} onClose={() => setOpenModal(null)} />
      <DatabaseDeleteModal database={database} opened={openModal === 'delete'} onClose={() => setOpenModal(null)} />

      <ContextMenu
        items={[
          { icon: faEye, label: 'Details', onClick: () => setOpenModal('details'), color: 'gray' },
          { icon: faTrash, label: 'Delete', onClick: () => setOpenModal('delete'), color: 'red' },
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

            <TableData>{database.type}</TableData>

            <TableData>
              <CopyOnClick content={host}>
                <Code>{host}</Code>
              </CopyOnClick>
            </TableData>

            <TableData>{database.username}</TableData>

            <TableData>{sizeLoading ? <Spinner size={16} /> : bytesToString(size)}</TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
