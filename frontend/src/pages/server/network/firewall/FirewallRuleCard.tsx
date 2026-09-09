import {
  faBan,
  faCheck,
  faClone,
  faEllipsis,
  faGripVertical,
  faPencil,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ComponentProps } from 'react';
import { z } from 'zod';
import ActionIcon from '@/elements/buttons/ActionIcon.tsx';
import Badge from '@/elements/data-display/Badge.tsx';
import Card from '@/elements/data-display/Card.tsx';
import ThemeIcon from '@/elements/data-display/ThemeIcon.tsx';
import Group from '@/elements/layout/Group.tsx';
import Stack from '@/elements/layout/Stack.tsx';
import ContextMenu from '@/elements/overlays/ContextMenu.tsx';
import Text from '@/elements/typography/Text.tsx';
import { serverFirewallRuleActionColorMapping, serverFirewallRuleActionLabelMapping } from '@/lib/enums.ts';
import { serverFirewallRuleSchema } from '@/lib/schemas/server/firewall.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { ruleSummary } from './ruleSummary.ts';

type Rule = z.infer<typeof serverFirewallRuleSchema>;

interface Props {
  rule: Rule;
  position: number;
  editable: boolean;
  shadowed?: boolean;
  dragHandleProps?: ComponentProps<'button'>;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export default function FirewallRuleCard({
  rule,
  position,
  editable,
  shadowed = false,
  dragHandleProps,
  onEdit,
  onDuplicate,
  onDelete,
}: Props) {
  const { t } = useTranslations();

  return (
    <ContextMenu
      items={[
        {
          type: 'action',
          icon: faPencil,
          label: t('common.button.edit', {}),
          onClick: () => onEdit?.(),
          color: 'gray',
          canAccess: editable,
        },
        {
          type: 'action',
          icon: faClone,
          label: t('common.button.duplicate', {}),
          onClick: () => onDuplicate?.(),
          color: 'gray',
          canAccess: editable,
        },
        {
          type: 'action',
          icon: faTrash,
          label: t('common.button.remove', {}),
          onClick: () => onDelete?.(),
          color: 'red',
          canAccess: editable,
        },
      ]}
      registry={window.extensionContext.extensionRegistry.pages.server.network.firewall.ruleContextMenu}
      registryProps={{ rule, position }}
    >
      {({ items, openMenu }) => (
        <Card
          className={shadowed ? 'opacity-60' : undefined}
          onContextMenu={(e) => {
            e.preventDefault();
            openMenu(e.clientX, e.clientY);
          }}
        >
          <Group justify='space-between' align='center' wrap='nowrap' gap='xs'>
            <Group gap='sm' align='center' wrap='nowrap' className='flex-1 min-w-0'>
              {editable && (
                <ActionIcon
                  size='lg'
                  variant='subtle'
                  color='gray'
                  aria-label={t('pages.server.firewall.rule.aria.reorder', { position })}
                  className='shrink-0'
                  {...dragHandleProps}
                >
                  <FontAwesomeIcon icon={faGripVertical} />
                </ActionIcon>
              )}

              <ThemeIcon size='lg' color={serverFirewallRuleActionColorMapping[rule.action]} className='shrink-0'>
                <FontAwesomeIcon icon={rule.action === 'allow' ? faCheck : faBan} />
              </ThemeIcon>

              <Stack gap={4} className='flex-1 min-w-0'>
                <Group gap='xs' wrap='nowrap'>
                  <Text size='sm' fw={600} c='dimmed' className='tabular-nums'>
                    {t('pages.server.firewall.rule.position', { position })}
                  </Text>
                  <Badge color={serverFirewallRuleActionColorMapping[rule.action]}>
                    {serverFirewallRuleActionLabelMapping[rule.action]()}
                  </Badge>
                  {shadowed && <Badge color='yellow'>{t('pages.server.firewall.rule.badge.shadowed', {})}</Badge>}
                </Group>
                <Text size='sm' c='dimmed'>
                  {ruleSummary(rule)}
                </Text>
              </Stack>
            </Group>

            {items.some((item) => item.type === 'action' && !item.hidden && item.canAccess !== false) && (
              <ActionIcon
                size='sm'
                variant='subtle'
                color='gray'
                className='shrink-0'
                aria-label={t('pages.server.firewall.rule.aria.actions', { position })}
                onClick={(e) => {
                  e.stopPropagation();
                  openMenu(e.clientX, e.clientY);
                }}
              >
                <FontAwesomeIcon icon={faEllipsis} />
              </ActionIcon>
            )}
          </Group>
        </Card>
      )}
    </ContextMenu>
  );
}
