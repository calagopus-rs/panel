import { faCrown, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from 'react-router';
import Code from '@/elements/Code.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';

export default function UserRow({ user }: { user: User }) {
  return (
    <TableRow>
      <TableData>
        <div className='size-5 aspect-square relative'>
          <img src={user.avatar ?? '/icon.svg'} alt={user.username} className='object-cover rounded-full select-none' />
        </div>
      </TableData>

      <TableData>
        <NavLink to={`/admin/users/${user.uuid}`} className='text-blue-400 hover:text-blue-200 hover:underline'>
          <Code>{user.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>
        <span className='flex gap-2 items-center'>
          {user.username}&nbsp;
          {user.admin && (
            <Tooltip label='Admin'>
              <FontAwesomeIcon icon={faCrown} className='text-yellow-400' />
            </Tooltip>
          )}
          {user.totpEnabled ? (
            <Tooltip label='2FA Enabled'>
              <FontAwesomeIcon icon={faLock} className='text-green-500' />
            </Tooltip>
          ) : (
            <Tooltip label='2FA Disabled'>
              <FontAwesomeIcon icon={faLockOpen} className='text-red-500' />
            </Tooltip>
          )}
        </span>
      </TableData>

      <TableData>
        <Code>
          {user.role ? (
            <NavLink
              to={`/admin/roles/${user.role.uuid}`}
              className='text-blue-400 hover:text-blue-200 hover:underline'
            >
              {user.role.name}
            </NavLink>
          ) : (
            '-'
          )}
        </Code>
      </TableData>

      <TableData>
        <Tooltip label={formatDateTime(user.created)}>{formatTimestamp(user.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
}
