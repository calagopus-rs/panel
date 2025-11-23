import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import getEggVariables from '@/api/admin/nests/eggs/variables/getEggVariables';
import Button from '@/elements/Button';
import EggVariableContainer from '@/pages/admin/nests/eggs/variables/EggVariableContainer';
import { useAdminStore } from '@/stores/admin';
import { DndContainer, DndItem, SortableItem } from '@/elements/DragAndDrop';
import updateEggVariableOrder from '@/api/admin/nests/eggs/variables/updateEggVariableOrder';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import Spinner from '@/elements/Spinner';
import { rectSortingStrategy } from '@dnd-kit/sortable';

interface DndEggVariable extends NestEggVariable, DndItem {
  id: string;
}

export default function AdminEggVariables({
  contextNest,
  contextEgg,
}: {
  contextNest: AdminNest;
  contextEgg: AdminNestEgg;
}) {
  const { eggVariables, setEggVariables, addEggVariable } = useAdminStore();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEggVariables(contextNest.uuid, contextEgg.uuid)
      .then((data) => {
        setEggVariables(data);
      })
      .catch((err) => {
        addToast(httpErrorToHuman(err), 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const addVariable = () => {
    addEggVariable({
      uuid: '',
      name: '',
      description: null,
      order: Number.isFinite(Math.max(...eggVariables.map((s) => s.order)))
        ? Math.max(...eggVariables.map((s) => s.order)) + 1
        : 1,
      envVariable: '',
      defaultValue: null,
      userViewable: true,
      userEditable: false,
      rules: [],
      created: new Date(),
    });
  };

  const sortedEggVariables = useMemo(() => [...eggVariables].sort((a, b) => a.order - b.order), [eggVariables]);

  const dndEggVariables: DndEggVariable[] = sortedEggVariables.map((variable) => ({
    ...variable,
    id: variable.uuid,
  }));

  return (
    <>
      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>Egg Variables</Title>
        <Button onClick={addVariable} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
          Add
        </Button>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <DndContainer
          items={dndEggVariables}
          strategy={rectSortingStrategy}
          callbacks={{
            onDragEnd: async (reorderedVariables) => {
              const variablesWithNewOrder = reorderedVariables.map((step, index) => ({
                ...step,
                order: index + 1,
              }));
              setEggVariables(variablesWithNewOrder);

              try {
                await updateEggVariableOrder(
                  contextNest.uuid,
                  contextEgg.uuid,
                  reorderedVariables.map((s) => s.uuid),
                );
              } catch (error) {
                addToast(httpErrorToHuman(error), 'error');
                setEggVariables(eggVariables);
              }
            },
          }}
          renderOverlay={(activeVariable) =>
            activeVariable ? (
              <div style={{ cursor: 'grabbing' }}>
                <EggVariableContainer
                  contextNest={contextNest}
                  contextEgg={contextEgg}
                  contextVariable={activeVariable}
                />
              </div>
            ) : null
          }
        >
          {(items) => (
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'>
              {items.map((variable, index) => (
                <SortableItem
                  key={variable.id}
                  id={variable.id}
                  renderItem={({ dragHandleProps }) => (
                    <div {...dragHandleProps}>
                      <EggVariableContainer
                        key={variable.uuid ?? index}
                        contextNest={contextNest}
                        contextEgg={contextEgg}
                        contextVariable={variable}
                      />
                    </div>
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
