import Spinner from '@/elements/Spinner';
import { useUserStore } from '@/stores/user';
import { Group, Title } from '@mantine/core';
import Table from '@/elements/Table';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import getOAuthLinks from '@/api/me/oauth-links/getOAuthLinks';
import OAuthLinkRow from './OAuthLinkRow';
import { useEffect, useState } from 'react';
import getOAuthProviders from '@/api/auth/getOAuthProviders';

export default () => {
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
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          OAuth Links
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
                      label: `Connect to ${oauthProvider.name}`,
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
                  color={'blue'}
                  rightSection={<FontAwesomeIcon icon={faChevronDown} />}
                >
                  Connect
                </Button>
              )}
            </ContextMenu>
          </ContextMenuProvider>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table
            columns={['Provider Name', 'Identifier', 'Last Used', 'Created', '']}
            pagination={oauthLinks}
            onPageSelect={setPage}
          >
            {oauthLinks.data.map((link) => (
              <OAuthLinkRow key={link.uuid} oauthLink={link} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
