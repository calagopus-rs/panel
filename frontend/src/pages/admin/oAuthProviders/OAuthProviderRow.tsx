import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { NavLink } from 'react-router';

export const oauthProviderTableColumns = [
  'ID',
  'Name',
  'Enabled',
  'Login Only',
  'Link Viewable',
  'User Manageable',
  'Created',
];

export default ({ oauthProvider }: { oauthProvider: AdminOAuthProvider }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink
          to={`/admin/oauth-providers/${oauthProvider.uuid}`}
          className={'text-blue-400 hover:text-blue-200 hover:underline'}
        >
          <Code>{oauthProvider.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{oauthProvider.name}</TableData>
      <TableData>{oauthProvider.enabled ? 'Yes' : 'No'}</TableData>
      <TableData>{oauthProvider.loginOnly ? 'Yes' : 'No'}</TableData>
      <TableData>{oauthProvider.linkViewable ? 'Yes' : 'No'}</TableData>
      <TableData>{oauthProvider.userManageable ? 'Yes' : 'No'}</TableData>
      <TableData>
        <Tooltip label={formatDateTime(oauthProvider.created)}>{formatTimestamp(oauthProvider.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
};
