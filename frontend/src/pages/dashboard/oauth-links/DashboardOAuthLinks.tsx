import { faChevronDown, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import getOAuthProviders from '@/api/auth/getOAuthProviders.ts';
import getOAuthLinks from '@/api/me/oauth-links/getOAuthLinks.ts';
import Button from '@/elements/Button.tsx';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import OAuthLinkRow from './OAuthLinkRow.tsx';

export default function DashboardOAuthLinks() {
  const { t } = useTranslations();
  const { oauthLinks, setOAuthLinks } = useUserStore();
  const [oAuthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    getOAuthProviders().then((oAuthProviders) => {
      setOAuthProviders(oAuthProviders);
    });
  }, []);

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: getOAuthLinks,
    setStoreData: setOAuthLinks,
  });

  return (
    <AccountContentContainer title={t('pages.account.oauthLinks.title', {})}>
      <Group justify='space-between' align='center' mb='md'>
        <Title order={1} c='white'>
          {t('pages.account.oauthLinks.title', {})}
        </Title>
        <Group>
          <ContextMenuProvider>
            <ContextMenu
              items={oAuthProviders
                .filter((p) => p.userManageable && !oauthLinks.data.some((l) => l.oauthProvider.uuid === p.uuid))
                .map(
                  (oauthProvider) =>
                    ({
                      icon: faFingerprint,
                      label: t('pages.account.oauthLinks.button.connectTo', { provider: oauthProvider.name }),
                      onClick: () => window.location.replace(`/api/auth/oauth/redirect/${oauthProvider.uuid}`),
                      color: 'gray',
                    }) as const,
                )}
            >
              {({ openMenu }) => (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    openMenu(rect.left, rect.bottom);
                  }}
                  disabled={
                    !oAuthProviders.filter((p) => !oauthLinks.data.some((l) => l.oauthProvider.uuid === p.uuid)).length
                  }
                  color='blue'
                  rightSection={<FontAwesomeIcon icon={faChevronDown} />}
                >
                  {t('pages.account.oauthLinks.button.connect', {})}
                </Button>
              )}
            </ContextMenu>
          </ContextMenuProvider>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={[
            t('pages.account.oauthLinks.table.columns.providerName', {}),
            t('pages.account.oauthLinks.table.columns.identifier', {}),
            t('common.table.columns.lastUsed', {}),
            t('common.table.columns.created', {}),
            '',
          ]}
          loading={loading}
          pagination={oauthLinks}
          onPageSelect={setPage}
        >
          {oauthLinks.data.map((link) => (
            <OAuthLinkRow key={link.uuid} oauthLink={link} />
          ))}
        </Table>
      </ContextMenuProvider>
    </AccountContentContainer>
  );
}
