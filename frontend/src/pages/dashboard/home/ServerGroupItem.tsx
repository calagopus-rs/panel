import { faChevronDown, faChevronUp, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ComponentProps, useState } from 'react';
import Card from '@/elements/Card';
import { ActionIcon, Group } from '@mantine/core';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import Code from '@/elements/Code';
import deleteServerGroup from '@/api/me/servers/groups/deleteServerGroup';
import { useUserStore } from '@/stores/user';
import { useToast } from '@/providers/ToastProvider';
import { getEmptyPaginationSet, httpErrorToHuman } from '@/api/axios';
import ServerGroupEditModal from './modals/ServerGroupEditModal';
import TextInput from '@/elements/input/TextInput';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import getServerGroupServers from '@/api/me/servers/groups/getServerGroupServers';
import Spinner from '@/elements/Spinner';
import ServerItem from './ServerItem';
import Divider from '@/elements/Divider';
import { Pagination } from '@/elements/Table';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import updateServerGroup from '@/api/me/servers/groups/updateServerGroup';
import { DndContainer, SortableItem, DndItem } from '@/elements/DragAndDrop';

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

export default function ServerGroupItem({
  serverGroup,
  dragHandleProps,
}: {
  serverGroup: UserServerGroup;
  dragHandleProps: ComponentProps<'div'>;
}) {
  const { updateServerGroup: updateStateServerGroup, removeServerGroup } = useUserStore();
  const { addToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(true);
  const [servers, setServers] = useState(getEmptyPaginationSet<Server>());
  const [openModal, setOpenModal] = useState<'edit' | 'delete'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getServerGroupServers(serverGroup.uuid, page, search),
    setStoreData: setServers,
    modifyParams: false,
  });

  const doDelete = async () => {
    await deleteServerGroup(serverGroup.uuid)
      .then(() => {
        removeServerGroup(serverGroup);
        addToast('Server group removed.', 'success');
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
        title='Confirm Server Group Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete
        <Code>{serverGroup.name}</Code>
        from your account?
      </ConfirmationModal>

      <Card key={serverGroup.uuid} p={8}>
        <Group justify='space-between' mb={isExpanded ? 'md' : undefined}>
          <Card
            p={6}
            className='flex-1'
            {...dragHandleProps}
            style={{
              ...dragHandleProps.style,
              touchAction: 'none',
            }}
          >
            <span className='text-sm font-mono text-white'>{serverGroup.name}</span>
          </Card>

          <div className='flex flex-row items-center gap-2'>
            <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />

            <ActionIcon variant='subtle' onClick={() => setOpenModal('edit')}>
              <FontAwesomeIcon icon={faPen} />
            </ActionIcon>
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
        </Group>

        {isExpanded && (
          <>
            {loading ? (
              <Spinner.Centered />
            ) : servers.total === 0 ? (
              <p className='text-gray-400'>No servers found</p>
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

                    // Update local state optimistically
                    setServers({ ...servers, data: items });

                    try {
                      await updateServerGroup(serverGroup.uuid, { serverOrder });
                    } catch (msg) {
                      addToast(httpErrorToHuman(msg), 'error');
                      updateStateServerGroup(serverGroup.uuid, {
                        serverOrder: serverGroup.serverOrder,
                      });
                      // Revert local state
                      setServers({ ...servers, data: servers.data });
                    }
                  },
                  onError: (error, originalItems) => {
                    // Additional error handling if needed
                    console.error('Drag error:', error);
                  },
                }}
                renderOverlay={(activeServer) =>
                  activeServer ? (
                    <div style={{ cursor: 'grabbing' }}>
                      <ServerItem server={activeServer} />
                    </div>
                  ) : null
                }
              >
                {(items) => (
                  <div className='gap-4 grid md:grid-cols-2'>
                    {items.map((server) => (
                      <SortableItem key={server.id} id={server.id}>
                        <ServerItem server={server} />
                      </SortableItem>
                    ))}
                  </div>
                )}
              </DndContainer>
            )}

            <Divider my='md' />

            <Pagination columns={[]} data={servers} onPageSelect={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
