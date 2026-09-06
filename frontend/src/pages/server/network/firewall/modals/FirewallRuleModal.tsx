import { Input, ModalProps } from '@mantine/core';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import Button from '@/elements/buttons/Button.tsx';
import Badge from '@/elements/data-display/Badge.tsx';
import Card from '@/elements/data-display/Card.tsx';
import MultiSelect from '@/elements/input/MultiSelect.tsx';
import Select from '@/elements/input/Select.tsx';
import ServerFileInput from '@/elements/input/ServerFileInput.tsx';
import TagsInput from '@/elements/input/TagsInput.tsx';
import Group from '@/elements/layout/Group.tsx';
import Stack from '@/elements/layout/Stack.tsx';
import FormModal from '@/elements/modals/FormModal.tsx';
import { ModalFooter } from '@/elements/modals/Modal.tsx';
import Text from '@/elements/typography/Text.tsx';
import {
  networkProtocolLabelMapping,
  serverFirewallRuleActionColorMapping,
  serverFirewallRuleActionLabelMapping,
} from '@/lib/enums.ts';
import { formatPortRanges, isNetwork, resolvePorts } from '@/lib/network/ip.ts';
import { serverFirewallRuleMaxPorts, serverFirewallRuleSchema } from '@/lib/schemas/server/firewall.ts';
import { useModalForm } from '@/plugins/form/useModalForm.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { useServerStore } from '@/stores/server.ts';
import { ruleSummary } from '../ruleSummary.ts';

type Rule = z.infer<typeof serverFirewallRuleSchema>;

type Props = ModalProps & {
  rule?: Rule;
  onSave: (rule: Rule) => Promise<void> | void;
};

const defaultValues: Rule = {
  action: 'deny',
  protocols: [],
  sources: [],
  ports: null,
  sourceFile: null,
};

function splitEntries(entries: string[]): string[] {
  return Array.from(new Set(entries.flatMap((entry) => entry.split(/[,\s]+/)).filter(Boolean)));
}

export default function FirewallRuleModal({ rule, onSave, ...props }: Props) {
  const { t } = useTranslations();
  const serverUuid = useServerStore((state) => state.server.uuid);
  const maxSources = useGlobalStore((state) => state.settings.server.maxFirewallRuleSourceCount);

  const [portEntries, setPortEntries] = useState<string[]>([]);

  const { form, handleClose, handleSubmit, loading, isDirty } = useModalForm<Rule>({
    initialValues: defaultValues,
    validate: zod4Resolver(serverFirewallRuleSchema),
    onClose: props.onClose,
    onSubmit: onSave,
  });

  useEffect(() => {
    if (!props.opened) return;

    const values = rule ?? defaultValues;
    form.setValues(values);
    form.resetDirty(values);
    setPortEntries(values.ports ? formatPortRanges(values.ports) : []);
  }, [props.opened]);

  const invalidSources = form.getValues().sources.filter((source) => !isNetwork(source));
  const tooManySources = form.getValues().sources.length > maxSources;
  const { resolved: resolvedPorts, toRemove: invalidPorts } = resolvePorts(portEntries);
  const tooManyPorts = resolvedPorts.length > serverFirewallRuleMaxPorts;

  const sourcesError =
    invalidSources.length > 0
      ? t('pages.server.firewall.form.invalidSource', { source: invalidSources[0] })
      : tooManySources
        ? t('pages.server.firewall.form.tooManySources', { max: maxSources })
        : undefined;
  const portsError =
    invalidPorts.length > 0
      ? t('pages.server.firewall.form.invalidPort', { port: invalidPorts[0] })
      : tooManyPorts
        ? t('pages.server.firewall.form.tooManyPorts', { max: serverFirewallRuleMaxPorts })
        : undefined;

  const previewRule: Rule = {
    ...form.getValues(),
    sources: form.getValues().sources.filter(isNetwork),
    ports: resolvedPorts.length > 0 ? resolvedPorts : null,
  };

  return (
    <FormModal
      isDirty={isDirty}
      loading={loading}
      title={
        rule
          ? t('pages.server.firewall.modal.editRule.title', {})
          : t('pages.server.firewall.modal.createRule.title', {})
      }
      {...props}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <Stack gap='md'>
        <Select
          withAsterisk
          label={t('pages.server.firewall.form.action', {})}
          data={Object.entries(serverFirewallRuleActionLabelMapping).map(([value, label]) => ({
            value,
            label: label(),
          }))}
          {...form.getInputProps('action')}
        />

        <MultiSelect
          label={t('pages.server.firewall.form.protocols', {})}
          description={t('pages.server.firewall.form.protocolsDescription', {})}
          placeholder={t('pages.server.firewall.form.anyProtocol', {})}
          data={Object.entries(networkProtocolLabelMapping).map(([value, label]) => ({ value, label }))}
          {...form.getInputProps('protocols')}
        />

        <Stack gap={4}>
          <TagsInput
            label={t('pages.server.firewall.form.sources', {})}
            description={t('pages.server.firewall.form.sourcesDescription', {})}
            placeholder='e.g. 203.0.113.4 or 10.0.0.0/8'
            allowReordering={false}
            value={form.getValues().sources}
            onChange={(sources) => form.setFieldValue('sources', splitEntries(sources))}
            invalidTags={invalidSources}
            error={sourcesError}
          />
          <Text size='xs' c={tooManySources ? 'red' : 'dimmed'}>
            {t('pages.server.firewall.form.sourcesCount', { count: form.getValues().sources.length, max: maxSources })}
          </Text>
        </Stack>

        <ServerFileInput
          serverUuid={serverUuid}
          label={t('pages.server.firewall.form.sourceFile', {})}
          description={t('pages.server.firewall.form.sourceFileDescription', {})}
          placeholder='e.g. firewall/allowed.txt'
          value={form.getValues().sourceFile ?? ''}
          onChange={(value) => form.setFieldValue('sourceFile', value === '' ? null : value)}
          error={form.errors.sourceFile}
        />

        <TagsInput
          label={t('pages.server.firewall.form.ports', {})}
          description={t('pages.server.firewall.form.portsDescription', {})}
          placeholder='e.g. 25565 or 25565-25570'
          allowReordering={false}
          value={portEntries}
          onChange={(entries) => {
            const next = splitEntries(entries);
            const { resolved } = resolvePorts(next);

            setPortEntries(next);
            form.setFieldValue('ports', resolved.length === 0 ? null : resolved.sort((a, b) => a - b));
          }}
          invalidTags={invalidPorts}
          error={portsError}
        />

        <Stack gap={2}>
          <Input.Label>{t('pages.server.firewall.form.preview', {})}</Input.Label>
          <Card p='sm'>
            <Group gap='xs' wrap='nowrap' align='center'>
              <Badge color={serverFirewallRuleActionColorMapping[previewRule.action]} className='shrink-0'>
                {serverFirewallRuleActionLabelMapping[previewRule.action]()}
              </Badge>
              <Text size='sm' c='dimmed'>
                {ruleSummary(previewRule)}
              </Text>
            </Group>
          </Card>
        </Stack>

        <ModalFooter>
          <Button
            type='submit'
            loading={loading}
            disabled={!form.isValid() || sourcesError !== undefined || portsError !== undefined}
          >
            {rule ? t('common.button.update', {}) : t('common.button.create', {})}
          </Button>
          <Button variant='default' onClick={handleClose}>
            {t('common.button.close', {})}
          </Button>
        </ModalFooter>
      </Stack>
    </FormModal>
  );
}
