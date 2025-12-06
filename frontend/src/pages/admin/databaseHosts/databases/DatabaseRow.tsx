import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import getDatabaseSize from '@/api/server/databases/getDatabaseSize';
import Code from '@/elements/Code';
import CopyOnClick from '@/elements/CopyOnClick';
import Spinner from '@/elements/Spinner';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { databaseTypeLabelMapping } from '@/lib/enums';
import { bytesToString } from '@/lib/size';
import { formatDateTime, formatTimestamp } from '@/lib/time';

export default function DatabaseRow({ database }: { database: AdminServerDatabase }) {
  const [size, setSize] = useState(0);
  const [sizeLoading, setSizeLoading] = useState(true);
  const host = `${database.host}:${database.port}`;

  useEffect(() => {
    getDatabaseSize(database.server.uuid, database.uuid)
      .then(setSize)
      .finally(() => setSizeLoading(false));
  }, []);

  return (
    <>
      <TableRow>
        <TableData>{database.name}</TableData>

        <TableData>
          <NavLink
            to={`/admin/servers/${database.server.uuid}`}
            className='text-blue-400 hover:text-blue-200 hover:underline'
          >
            <Code>{database.server.name}</Code>
          </NavLink>
        </TableData>

        <TableData>{databaseTypeLabelMapping[database.type]}</TableData>

        <TableData>
          <CopyOnClick content={host}>
            <Code>{host}</Code>
          </CopyOnClick>
        </TableData>

        <TableData>{database.username}</TableData>

        <TableData>{sizeLoading ? <Spinner size={16} /> : bytesToString(size)}</TableData>

        <TableData>
          <Tooltip label={formatDateTime(database.created)}>{formatTimestamp(database.created)}</Tooltip>
        </TableData>
      </TableRow>
    </>
  );
}
