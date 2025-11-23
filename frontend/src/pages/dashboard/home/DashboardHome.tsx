import { useEffect, useMemo, useState } from 'react';
import DashboardHomeTitle from './DashboardHomeTitle';
import { useUserStore } from '@/stores/user';
import { useToast } from '@/providers/ToastProvider';
import getServerGroups from '@/api/me/servers/groups/getServerGroups';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import ServerGroupItem from './ServerGroupItem';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import ServerGroupCreateModal from './modals/ServerGroupCreateModal';
import updateServerGroupsOrder from '@/api/me/servers/groups/updateServerGroupsOrder';
import { DndContainer, SortableItem, DndItem } from '@/elements/DragAndDrop';

interface DndServerGroup extends UserServerGroup, DndItem {
  id: string;
}

export default function DashboardHome() {
  const { serverGroups, setServerGroups } = useUserStore();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'create'>(null);

  useEffect(() => {
    getServerGroups()
      .then((response) => {
        setServerGroups(response);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [addToast, setServerGroups]);

  const sortedServerGroups = useMemo(() => [...serverGroups].sort((a, b) => a.order - b.order), [serverGroups]);

  const dndServerGroups: DndServerGroup[] = sortedServerGroups.map((g) => ({ ...g, id: g.uuid }));

  return (
    <>
      <ServerGroupCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <DashboardHomeTitle />

      <Button
        onClick={() => setOpenModal('create')}
        color='blue'
        leftSection={<FontAwesomeIcon icon={faPlus} />}
        mb='md'
      >
        Create Group
      </Button>

      {loading ? (
        <Spinner.Centered />
      ) : serverGroups.length === 0 ? (
        <p className='text-gray-400'>No server groups found</p>
      ) : (
        <DndContainer
          items={dndServerGroups}
          callbacks={{
            onDragEnd: async (items) => {
              const reorderedGroups = items.map((g, i) => ({ ...g, order: i }));
              setServerGroups(reorderedGroups);

              try {
                await updateServerGroupsOrder(items.map((g) => g.uuid));
              } catch (msg) {
                addToast(httpErrorToHuman(msg), 'error');
                setServerGroups(serverGroups);
              }
            },
          }}
          renderOverlay={(activeItem) =>
            activeItem ? (
              <div style={{ cursor: 'grabbing' }}>
                <ServerGroupItem
                  serverGroup={activeItem}
                  dragHandleProps={{
                    style: { cursor: 'grabbing' },
                  }}
                />
              </div>
            ) : null
          }
        >
          {(items) => (
            <div className='flex flex-col gap-4'>
              {items.map((serverGroup) => (
                <SortableItem
                  key={serverGroup.id}
                  id={serverGroup.id}
                  renderItem={({ dragHandleProps }) => (
                    <ServerGroupItem serverGroup={serverGroup} dragHandleProps={dragHandleProps} />
                  )}
                />
              ))}
            </div>
          )}
        </DndContainer>
      )}
    </>
  );
}
