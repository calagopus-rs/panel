import { useEffect, useState } from 'react';
import DashboardHomeTitle from './DashboardHomeTitle';
import { useUserStore } from '@/stores/user';
import { useToast } from '@/providers/ToastProvider';
import getServerGroups from '@/api/me/servers/groups/getServerGroups';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import ServerGroupItem from './ServerGroupItem';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import ServerGroupCreateModal from './modals/ServerGroupCreateModal';
import updateServerGroupsOrder from '@/api/me/servers/groups/updateServerGroupsOrder';

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

function SortableServerGroup({ serverGroup }: { serverGroup: UserServerGroup }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: serverGroup.uuid,
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ServerGroupItem
        serverGroup={serverGroup}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          style: {
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          },
        }}
      />
    </div>
  );
}

export default function DashboardHome() {
  const { serverGroups, setServerGroups } = useUserStore();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'create'>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

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

  useEffect(() => {
    getServerGroups()
      .then((response) => {
        load(false, setLoading);
        setServerGroups(response);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  }, [addToast, setServerGroups]);

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = serverGroups.findIndex((g) => g.uuid === active.id);
    const newIndex = serverGroups.findIndex((g) => g.uuid === over.id);

    const items = arrayMove(serverGroups, oldIndex, newIndex);

    setServerGroups(items.map((g, i) => ({ ...g, order: i })));

    updateServerGroupsOrder(items.map((g) => g.uuid)).catch((msg) => {
      addToast(httpErrorToHuman(msg), 'error');
      setServerGroups(serverGroups);
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const sortedServerGroups = [...serverGroups].sort((a, b) => a.order - b.order);
  const activeServerGroup = activeId ? serverGroups.find((g) => g.uuid === activeId) : null;

  return (
    <>
      <ServerGroupCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <DashboardHomeTitle />

      <Button
        onClick={() => setOpenModal('create')}
        color={'blue'}
        leftSection={<FontAwesomeIcon icon={faPlus} />}
        mb={'md'}
      >
        Create Group
      </Button>

      {loading ? (
        <Spinner.Centered />
      ) : serverGroups.length === 0 ? (
        <p className={'text-gray-400'}>No server groups found</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={sortedServerGroups.map((g) => g.uuid)} strategy={verticalListSortingStrategy}>
            <div className={'flex flex-col gap-4'}>
              {sortedServerGroups.map((serverGroup) => (
                <SortableServerGroup key={serverGroup.uuid} serverGroup={serverGroup} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeServerGroup ? (
              <div style={{ cursor: 'grabbing' }}>
                <ServerGroupItem
                  serverGroup={activeServerGroup}
                  dragHandleProps={{
                    style: { cursor: 'grabbing' },
                  }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}
