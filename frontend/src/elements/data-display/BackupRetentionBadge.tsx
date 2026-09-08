import Badge from '@/elements/data-display/Badge.tsx';
import Tooltip from '@/elements/overlays/Tooltip.tsx';
import { type BackupRetention, backupRetentionRules } from '@/lib/schemas/backupRetention.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';

interface BackupRetentionBadgeProps {
  retention: BackupRetention;
  className?: string;
}

export default function BackupRetentionBadge({ retention, className }: BackupRetentionBadgeProps) {
  const { t } = useTranslations();

  const activeRules = backupRetentionRules.filter((rule) => retention[rule] > 0);

  if (activeRules.length === 0) {
    return (
      <Badge variant='light' color='gray' className={className}>
        {t('common.elements.backupRetention.disabled', {})}
      </Badge>
    );
  }

  return (
    <Tooltip
      label={activeRules
        .map((rule) =>
          t('common.elements.backupRetention.ruleSummary', {
            rule: t(`common.elements.backupRetention.${rule}`, {}),
            count: retention[rule],
          }),
        )
        .join(', ')}
    >
      <Badge variant='light' color='blue' className={className}>
        {t('common.elements.backupRetention.title', {})}
      </Badge>
    </Tooltip>
  );
}
