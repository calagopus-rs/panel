import { NavLink } from 'react-router';
import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';

export default function UserOAuthLinkRow({ userOAuthLink }: { userOAuthLink: AdminUserOAuthLink }) {
  return (
    <TableRow>
      <TableData>
        <Code>{userOAuthLink.uuid}</Code>
      </TableData>

      <TableData>
        <NavLink
          to={`/admin/users/${userOAuthLink.user.uuid}`}
          className='text-blue-400 hover:text-blue-200 hover:underline'
        >
          <Code>{userOAuthLink.user.username}</Code>
        </NavLink>
      </TableData>

      <TableData>
        <Code>{userOAuthLink.identifier}</Code>
      </TableData>

      <TableData>
        {!userOAuthLink.lastUsed ? (
          'N/A'
        ) : (
          <Tooltip label={formatDateTime(userOAuthLink.lastUsed)}>{formatTimestamp(userOAuthLink.lastUsed)}</Tooltip>
        )}
      </TableData>

      <TableData>
        <Tooltip label={formatDateTime(userOAuthLink.created)}>{formatTimestamp(userOAuthLink.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
}
