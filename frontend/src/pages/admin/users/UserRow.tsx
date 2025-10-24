import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { faCrown, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from 'react-router';

export const userTableColumns = ['ID', 'Username', 'Role', 'Created'];

export default ({ user }: { user: User }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink to={`/admin/users/${user.uuid}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          <Code>{user.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>
        <span className={'flex gap-2 items-center'}>
          {user.username}&nbsp;
          {user.admin && (
            <Tooltip label={'Admin'}>
              <FontAwesomeIcon icon={faCrown} className={'text-yellow-400'} />
            </Tooltip>
          )}
          {user.totpEnabled ? (
            <Tooltip label={'2FA Enabled'}>
              <FontAwesomeIcon icon={faLock} className={'text-green-500'} />
            </Tooltip>
          ) : (
            <Tooltip label={'2FA Disabled'}>
              <FontAwesomeIcon icon={faLockOpen} className={'text-red-500'} />
            </Tooltip>
          )}
        </span>
      </TableData>

      <TableData>{user.role?.name ?? '-'}</TableData>

      <TableData>
        <Tooltip label={formatDateTime(user.created)}>{formatTimestamp(user.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
};
