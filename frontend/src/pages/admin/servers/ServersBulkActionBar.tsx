import { faPause, faPlay, faSatellite, faTrash, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ActionBar from '@/elements/ActionBar.tsx';
import Button from '@/elements/buttons/Button.tsx';
import { AdminCan } from '@/elements/Can.tsx';
import Tooltip from '@/elements/overlays/Tooltip.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';

export type BulkServerAction = 'suspend' | 'unsuspend' | 'clearState' | 'delete';

const ACTIONS: {
  action: BulkServerAction;
  icon: IconDefinition;
  color?: string;
  permission: string;
}[] = [
  { action: 'suspend', icon: faPause, permission: 'servers.update' },
  { action: 'unsuspend', icon: faPlay, permission: 'servers.update' },
  { action: 'clearState', icon: faSatellite, permission: 'servers.update' },
  { action: 'delete', icon: faTrash, color: 'red', permission: 'servers.delete' },
];

interface ServersBulkActionBarProps {
  selectedCount: number;
  onAction: (action: BulkServerAction) => void;
  loading: BulkServerAction | null;
}

export default function ServersBulkActionBar({ selectedCount, onAction, loading }: ServersBulkActionBarProps) {
  const { t, tItem } = useTranslations();

  return (
    <ActionBar opened={selectedCount > 0}>
      {ACTIONS.map(({ action, icon, color, permission }) => (
        <AdminCan key={action} action={permission}>
          <Tooltip label={`${t(`pages.admin.servers.bulkActions.${action}`, {})} (${tItem('server', selectedCount)})`}>
            <Button
              color={color}
              onClick={() => onAction(action)}
              loading={loading === action}
              disabled={loading !== null && loading !== action}
              aria-label={t(`pages.admin.servers.bulkActions.${action}`, {})}
              px='sm'
            >
              <FontAwesomeIcon icon={icon} />
            </Button>
          </Tooltip>
        </AdminCan>
      ))}
    </ActionBar>
  );
}
