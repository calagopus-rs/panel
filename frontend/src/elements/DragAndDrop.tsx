import { ReactNode, useState, CSSProperties, ComponentProps, useEffect } from 'react';
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
  CollisionDetection,
  DropAnimation,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  SortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type DndItem = {
  id: string;
};

export interface DndConfig {
  pointerActivationDistance?: number;
  touchActivationDelay?: number;
  touchActivationTolerance?: number;
  dragOverlayDuration?: number;
  dragOverlayEasing?: string;
}

export interface DndCallbacks<T extends DndItem> {
  onDragStart?: (item: T) => void;
  onDragEnd: (items: T[], oldIndex: number, newIndex: number) => void | Promise<void>;
  onDragCancel?: () => void;
  onError?: (error: unknown, originalItems: T[]) => void;
}

export function useDndSensors(config: DndConfig = {}) {
  const { pointerActivationDistance = 8, touchActivationDelay = 200, touchActivationTolerance = 8 } = config;

  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: pointerActivationDistance,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: touchActivationDelay,
        tolerance: touchActivationTolerance,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

export function useDndState<T extends DndItem>(items: T[], callbacks: DndCallbacks<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<T[]>(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleDragStart = (event: DragEndEvent) => {
    const activeItem = items.find((item) => item.id === event.active.id);
    setActiveId(event.active.id as string);

    if (activeItem && callbacks.onDragStart) {
      callbacks.onDragStart(activeItem);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(reorderedItems);

    try {
      await callbacks.onDragEnd(reorderedItems, oldIndex, newIndex);
    } catch (error) {
      setLocalItems(items);
      if (callbacks.onError) callbacks.onError(error, items);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    if (callbacks.onDragCancel) callbacks.onDragCancel();
  };

  const activeItem = activeId ? localItems.find((item) => item.id === activeId) : null;

  return {
    activeId,
    activeItem,
    localItems,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}

export function createDropAnimation(config: DndConfig = {}): DropAnimation {
  const { dragOverlayDuration = 300, dragOverlayEasing = 'cubic-bezier(0.25, 1, 0.5, 1)' } = config;

  return {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
    duration: dragOverlayDuration,
    easing: dragOverlayEasing,
  };
}

export interface SortableItemProps {
  id: string;
  children?: ReactNode;
  disabled?: boolean;
  transitionDuration?: number;
  transitionEasing?: string;
  renderItem?: (props: { isDragging: boolean; dragHandleProps: ComponentProps<'div'> }) => ReactNode;
}

export function SortableItem({
  id,
  children,
  disabled = false,
  transitionDuration = 300,
  transitionEasing = 'cubic-bezier(0.25, 1, 0.5, 1)',
  renderItem,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
    transition: {
      duration: transitionDuration,
      easing: transitionEasing,
    },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
    style: {
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none' as const,
    },
  };

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem ? renderItem({ isDragging, dragHandleProps }) : <div {...dragHandleProps}>{children}</div>}
    </div>
  );
}

export interface DndContainerProps<T extends DndItem> {
  items: T[];
  callbacks: DndCallbacks<T>;
  config?: DndConfig;
  strategy?: SortingStrategy;
  collisionDetection?: CollisionDetection;
  children: (items: T[]) => ReactNode;
  renderOverlay?: (activeItem: T | null) => ReactNode;
}

export function DndContainer<T extends DndItem>({
  items,
  callbacks,
  config = {},
  strategy = verticalListSortingStrategy,
  collisionDetection = closestCenter,
  children,
  renderOverlay,
}: DndContainerProps<T>) {
  const sensors = useDndSensors(config);
  const dropAnimation = createDropAnimation(config);

  const { activeItem, localItems, handleDragStart, handleDragEnd, handleDragCancel } = useDndState(items, callbacks);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={strategy}>
        {children(localItems)}
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {renderOverlay && activeItem ? renderOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  );
}
