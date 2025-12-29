import { rectSortingStrategy } from '@dnd-kit/sortable';
import { faChevronDown, faChevronUp, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { ComponentProps, memo, useState } from 'react';
import { getEmptyPaginationSet, httpErrorToHuman } from '@/api/axios.ts';
import deleteServerGroup from '@/api/me/servers/groups/deleteServerGroup.ts';
import getServerGroupServers from '@/api/me/servers/groups/getServerGroupServers.ts';
import updateServerGroup from '@/api/me/servers/groups/updateServerGroup.ts';
import Card from '@/elements/Card.tsx';
import Divider from '@/elements/Divider.tsx';
import { DndContainer, DndItem, SortableItem } from '@/elements/DragAndDrop.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { Pagination } from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import ServerGroupEditModal from './modals/ServerGroupEditModal.tsx';
import ServerItem from './ServerItem.tsx';

function insertItems<T>(list: T[], items: T[], startIndex: number): T[] {
  if (startIndex > list.length) {
    throw new Error(`startIndex ${startIndex} is beyond array size ${list.length}`);
  }

  const result = Array.from(list);
  result.splice(startIndex, items.length, ...items);
  return result;
}

interface DndServer extends Server, DndItem {
  id: string;
}

const MemoizedServerItem = memo(ServerItem);

export default function ServerGroupItem({
  serverGroup,
  dragHandleProps,
}: {
  serverGroup: UserServerGroup;
  dragHandleProps: ComponentProps<'div'>;
}) {
  const { t } = useTranslations();
  const { updateServerGroup: updateStateServerGroup, removeServerGroup } = useUserStore();
  const { addToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(true);
  const [servers, setServers] = useState(getEmptyPaginationSet<Server>());
  const [openModal, setOpenModal] = useState<'edit' | 'delete' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getServerGroupServers(serverGroup.uuid, page, search),
    setStoreData: setServers,
    modifyParams: false,
  });

  const doDelete = async () => {
    await deleteServerGroup(serverGroup.uuid)
      .then(() => {
        removeServerGroup(serverGroup);
        addToast(t('pages.account.home.tabs.groupedServers.page.modal.deleteServerGroup.toast.deleted', {}), 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const dndServers: DndServer[] = servers.data.map((s) => ({
    ...s,
    id: `${serverGroup.uuid}-${s.uuid}`,
  }));

  return (
    <>
      <ServerGroupEditModal
        serverGroup={serverGroup}
        opened={openModal === 'edit'}
        onClose={() => setOpenModal(null)}
      />
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={t('pages.account.home.tabs.groupedServers.page.modal.deleteServerGroup.title', {})}
        confirm={t('common.button.delete', {})}
        onConfirmed={doDelete}
      >
        {t('pages.account.home.tabs.groupedServers.page.modal.deleteServerGroup.content', {
          group: serverGroup.name,
        }).md()}
      </ConfirmationModal>

      <Card key={serverGroup.uuid} p={8}>
        <div className='grid grid-cols-2 gap-4 '>
          <Card
            p={6}
            radius='sm'
            className='flex-1 flex flex-row! justify-between! items-center!'
            {...dragHandleProps}
            style={{
              ...dragHandleProps.style,
              touchAction: 'none',
            }}
          >
            <span className='text-sm font-mono text-white'>{serverGroup.name}</span>
            <ActionIcon variant='subtle' onClick={() => setOpenModal('edit')} className='-mr-0.5 -my-2'>
              <FontAwesomeIcon icon={faPen} />
            </ActionIcon>
          </Card>

          <div className='flex flex-row items-center gap-2'>
            <TextInput
              placeholder={t('common.input.search', {})}
              className='h-full w-full'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <ActionIcon color='red' variant='subtle' onClick={() => setOpenModal('delete')}>
              <FontAwesomeIcon icon={faTrash} />
            </ActionIcon>
            <ActionIcon variant='subtle' onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (
                <FontAwesomeIcon icon={faChevronUp} className='w-4 h-4 text-gray-200' />
              ) : (
                <FontAwesomeIcon icon={faChevronDown} className='w-4 h-4 text-gray-200' />
              )}
            </ActionIcon>
          </div>
        </div>

        {isExpanded && (
          <>
            {loading ? (
              <Spinner.Centered />
            ) : servers.total === 0 ? (
              <p className='text-gray-400 mt-4'>{t('pages.account.home.noServers', {})}</p>
            ) : (
              <DndContainer
                items={dndServers}
                strategy={rectSortingStrategy}
                callbacks={{
                  onDragEnd: async (items) => {
                    const serverOrder = insertItems(
                      serverGroup.serverOrder,
                      items.map((s) => s.uuid),
                      (servers.page - 1) * servers.perPage,
                    );

                    setServers({ ...servers, data: items });

                    await updateServerGroup(serverGroup.uuid, { serverOrder }).catch((err) => {
                      addToast(httpErrorToHuman(err), 'error');
                      updateStateServerGroup(serverGroup.uuid, {
                        serverOrder: serverGroup.serverOrder,
                      });
                      setServers({ ...servers, data: servers.data });
                    });
                  },
                  onError: (error, originalItems) => {
                    console.error('Drag error:', error);
                  },
                }}
                renderOverlay={(activeServer) =>
                  activeServer ? (
                    <div style={{ cursor: 'grabbing' }}>
                      <MemoizedServerItem server={activeServer} onGroupRemove={() => null} />
                    </div>
                  ) : null
                }
              >
                {(items) => (
                  <div className='gap-4 grid sm:grid-cols-2 mt-4'>
                    {items.map((server, i) => (
                      <SortableItem key={server.id} id={server.id}>
                        <MemoizedServerItem
                          server={server}
                          onGroupRemove={() => {
                            const serverOrder = serverGroup.serverOrder.filter(
                              (_, orderI) => (servers.page - 1) * servers.perPage + i !== orderI,
                            );
                            updateStateServerGroup(serverGroup.uuid, {
                              serverOrder,
                            });
                            setServers((prev) => ({ ...prev, data: prev.data.filter((_, dataI) => i !== dataI) }));

                            updateServerGroup(serverGroup.uuid, { serverOrder }).catch((msg) => {
                              addToast(httpErrorToHuman(msg), 'error');
                            });
                          }}
                        />
                      </SortableItem>
                    ))}
                  </div>
                )}
              </DndContainer>
            )}

            {servers.total > servers.perPage && (
              <>
                <Divider my='md' />
                <Pagination data={servers} onPageSelect={setPage} />
              </>
            )}
          </>
        )}
      </Card>
    </>
  );
}
