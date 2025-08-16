import Code from '@/elements/Code';
import { TableRow } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { faCrown, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from 'react-router';

export default ({ user }: { user: User }) => {
  return (
    <TableRow>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <NavLink to={`/admin/users/${user.uuid}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          <Code>{user.uuid}</Code>
        </NavLink>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <span className={'flex gap-2 items-center'}>
          {user.username}{' '}
          {user.admin && (
            <Tooltip content={'Admin'}>
              <FontAwesomeIcon icon={faCrown} className={'text-yellow-400'} />
            </Tooltip>
          )}
          {user.totpEnabled ? (
            <Tooltip content={'2FA Enabled'}>
              <FontAwesomeIcon icon={faLock} className={'text-green-500'} />
            </Tooltip>
          ) : (
            <Tooltip content={'2FA Disabled'}>
              <FontAwesomeIcon icon={faLockOpen} className={'text-red-500'} />
            </Tooltip>
          )}
        </span>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <Tooltip content={formatDateTime(user.created)}>{formatTimestamp(user.created)}</Tooltip>
      </td>
    </TableRow>
  );
};
