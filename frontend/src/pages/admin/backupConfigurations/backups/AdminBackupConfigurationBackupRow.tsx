import { NavLink } from 'react-router';
import Code from '@/elements/Code.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import { bytesToString } from '@/lib/size.ts';
import { formatTimestamp } from '@/lib/time.ts';

export default function AdminBackupConfigurationBackupRow({ backup }: { backup: AdminServerBackup }) {
  return (
    <>
      <TableRow>
        <TableData>{backup.name}</TableData>

        <TableData>
          <Code>
            {backup.server ? (
              <NavLink
                to={`/admin/servers/${backup.server.uuid}`}
                className='text-blue-400 hover:text-blue-200 hover:underline'
              >
                {backup.server.name}
              </NavLink>
            ) : (
              '-'
            )}
          </Code>
        </TableData>

        <TableData>{backup.checksum && <Code>{backup.checksum}</Code>}</TableData>

        {backup.completed ? (
          <TableData>{bytesToString(backup.bytes)}</TableData>
        ) : (
          <TableData colSpan={2}>
            <Spinner />
          </TableData>
        )}

        <TableData>{backup.completed ? backup.files : null}</TableData>

        <TableData>{formatTimestamp(backup.created)}</TableData>
      </TableRow>
    </>
  );
}
