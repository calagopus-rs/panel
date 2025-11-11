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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import updateServerGroup from '@/api/me/servers/groups/updateServerGroup';

function insertItems<T>(list: T[], items: T[], startIndex: number): T[] {
  if (startIndex > list.length) {
    throw new Error(`startIndex ${startIndex} is beyond array size ${list.length}`);
  }

  const result = Array.from(list);
  result.splice(startIndex, items.length, ...items);
  return result;
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
  duration: 300,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
};

function SortableServerItem({ server, serverGroupUuid }: { server: Server; serverGroupUuid: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${serverGroupUuid}-${server.uuid}`,
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ServerItem server={server} />
    </div>
  );
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getServerGroupServers(serverGroup.uuid, page, search),
    setStoreData: setServers,
    modifyParams: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = servers.data.findIndex((s) => `${serverGroup.uuid}-${s.uuid}` === active.id);
    const newIndex = servers.data.findIndex((s) => `${serverGroup.uuid}-${s.uuid}` === over.id);

    const items = arrayMove(servers.data, oldIndex, newIndex);
    const serverOrder = insertItems(
      serverGroup.serverOrder,
      items.map((s) => s.uuid),
      (servers.page - 1) * servers.perPage,
    );

    setServers({ ...servers, data: items });

    updateServerGroup(serverGroup.uuid, { serverOrder }).catch((msg) => {
      addToast(httpErrorToHuman(msg), 'error');
      updateStateServerGroup(serverGroup.uuid, { serverOrder: serverGroup.serverOrder });

      setServers({ ...servers, data: arrayMove(items, newIndex, oldIndex) });
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeServer = activeId ? servers.data.find((s) => `${serverGroup.uuid}-${s.uuid}` === activeId) : null;

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
        title={'Confirm Server Group Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete
        <Code>{serverGroup.name}</Code>
        from your account?
      </ConfirmationModal>

      <Card key={serverGroup.uuid} p={8}>
        <Group justify={'space-between'} mb={isExpanded ? 'md' : undefined}>
          <Card p={6} className={'flex-1'} {...dragHandleProps}>
            <span className={'text-sm font-mono text-white'}>{serverGroup.name}</span>
          </Card>

          <div className={'flex flex-row items-center gap-2'}>
            <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />

            <ActionIcon variant={'subtle'} onClick={() => setOpenModal('edit')}>
              <FontAwesomeIcon icon={faPen} />
            </ActionIcon>
            <ActionIcon color={'red'} variant={'subtle'} onClick={() => setOpenModal('delete')}>
              <FontAwesomeIcon icon={faTrash} />
            </ActionIcon>
            <ActionIcon variant={'subtle'} onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (
                <FontAwesomeIcon icon={faChevronUp} className={'w-4 h-4 text-gray-200'} />
              ) : (
                <FontAwesomeIcon icon={faChevronDown} className={'w-4 h-4 text-gray-200'} />
              )}
            </ActionIcon>
          </div>
        </Group>

        {isExpanded && (
          <>
            {loading ? (
              <Spinner.Centered />
            ) : servers.total === 0 ? (
              <p className={'text-gray-400'}>No servers found</p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={servers.data.map((s) => `${serverGroup.uuid}-${s.uuid}`)}
                  strategy={rectSortingStrategy}
                >
                  <div className={'gap-4 grid md:grid-cols-2'}>
                    {servers.data.map((server) => (
                      <SortableServerItem
                        key={`${serverGroup.uuid}-${server.uuid}`}
                        server={server}
                        serverGroupUuid={serverGroup.uuid}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={dropAnimationConfig}>
                  {activeServer ? (
                    <div style={{ cursor: 'grabbing' }}>
                      <ServerItem server={activeServer} />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            <Divider my={'md'} />

            <Pagination columns={[]} data={servers} onPageSelect={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
