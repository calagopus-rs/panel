import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { httpErrorToHuman } from '@/api/axios.ts';
import createAllocation from '@/api/server/allocations/createAllocation.ts';
import getAllocations from '@/api/server/allocations/getAllocations.ts';
import Button from '@/elements/Button.tsx';
import ConditionalTooltip from '@/elements/ConditionalTooltip.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import AllocationRow from './AllocationRow.tsx';

export default function ServerNetwork() {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { server, allocations, setAllocations, addAllocation } = useServerStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getAllocations(server.uuid, page, search),
    setStoreData: setAllocations,
  });

  const doAdd = () => {
    createAllocation(server.uuid)
      .then((alloc) => {
        addAllocation(alloc);
        addToast(t('pages.server.network.toast.created', {}), 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <ServerContentContainer
      title={t('pages.server.network.title', {})}
      subtitle={t('pages.server.network.subtitle', {
        current: allocations.total,
        max: server.featureLimits.allocations,
      })}
      search={search}
      setSearch={setSearch}
      contentRight={
        <ConditionalTooltip
          enabled={allocations.total >= server.featureLimits.allocations}
          label={t('pages.server.network.tooltip.limitReached', { max: server.featureLimits.allocations })}
        >
          <Button
            disabled={allocations.total >= server.featureLimits.allocations}
            onClick={doAdd}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            {t('common.button.add', {})}
          </Button>
        </ConditionalTooltip>
      }
    >
      <ContextMenuProvider>
        <Table
          columns={[
            '',
            t('pages.server.network.table.columns.hostname', {}),
            t('pages.server.network.table.columns.port', {}),
            t('pages.server.network.table.columns.notes', {}),
            t('common.table.columns.created', {}),
            '',
          ]}
          loading={loading}
          pagination={allocations}
          onPageSelect={setPage}
        >
          {allocations.data.map((allocation) => (
            <AllocationRow key={allocation.uuid} allocation={allocation} />
          ))}
        </Table>
      </ContextMenuProvider>
    </ServerContentContainer>
  );
}
