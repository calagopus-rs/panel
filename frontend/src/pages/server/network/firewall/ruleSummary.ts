import { z } from 'zod';
import { networkProtocolLabelMapping } from '@/lib/enums.ts';
import { formatPortRanges } from '@/lib/network/ip.ts';
import { serverFirewallRuleSchema } from '@/lib/schemas/server/firewall.ts';
import { getTranslations } from '@/providers/TranslationProvider.tsx';

const MAX_LISTED_SOURCES = 6;

export function ruleSummary(rule: z.infer<typeof serverFirewallRuleSchema>): string {
  const { t } = getTranslations();

  const sources = rule.sourceFile ? [t('pages.server.firewall.rule.sourceFile', { file: rule.sourceFile })] : [];
  sources.push(...rule.sources.slice(0, MAX_LISTED_SOURCES));
  if (rule.sources.length > MAX_LISTED_SOURCES) {
    sources.push(t('pages.server.firewall.rule.moreSources', { count: rule.sources.length - MAX_LISTED_SOURCES }));
  }

  return t('pages.server.firewall.rule.summary', {
    protocols:
      rule.protocols.length > 0
        ? rule.protocols
            .toSorted()
            .map((protocol) => networkProtocolLabelMapping[protocol])
            .join(', ')
        : t('pages.server.firewall.rule.anyProtocol', {}),
    sources: sources.length > 0 ? sources.join(', ') : t('pages.server.firewall.rule.anySource', {}),
    ports: rule.ports ? formatPortRanges(rule.ports).join(', ') : t('pages.server.firewall.rule.allAllocations', {}),
  });
}
