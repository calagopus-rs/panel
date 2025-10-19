import Code from '@/elements/Code';
import CopyOnClick from '@/elements/CopyOnClick';
import { useEffect, useState } from 'react';
import { TableData, TableRow } from '@/elements/Table';
import { bytesToString } from '@/lib/size';
import getDatabaseSize from '@/api/server/databases/getDatabaseSize';
import Spinner from '@/elements/Spinner';
import { databaseTypeLabelMapping } from '@/lib/enums';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import Tooltip from '@/elements/Tooltip';
import { NavLink } from 'react-router';

export default ({ database }: { database: AdminServerDatabase }) => {
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
            className={'text-blue-400 hover:text-blue-200 hover:underline'}
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
};
