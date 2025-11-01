import { Group, Title } from '@mantine/core';
import { useAdminStore } from '@/stores/admin';
import { useEffect } from 'react';
import getEggVariables from '@/api/admin/nests/eggs/variables/getEggVariables';
import EggVariableContainer from '@/pages/admin/nests/eggs/variables/EggVariableContainer';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default ({ contextNest, contextEgg }: { contextNest: Nest; contextEgg: AdminNestEgg }) => {
  const { eggVariables, setEggVariables, addEggVariable } = useAdminStore();

  useEffect(() => {
    getEggVariables(contextNest.uuid, contextEgg.uuid).then((data) => {
      setEggVariables(data);
    });
  }, []);

  const addVariable = () => {
    addEggVariable({
      name: '',
      description: null,
      order: 0,
      envVariable: '',
      defaultValue: null,
      userViewable: true,
      userEditable: false,
      rules: [],
    });
  };

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={2}>Egg Variables</Title>
        <Button onClick={addVariable} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
          Add
        </Button>
      </Group>
      <div className={'grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'}>
        {eggVariables.map((variable, index) => (
          <EggVariableContainer
            key={variable.uuid ?? index}
            contextNest={contextNest}
            contextEgg={contextEgg}
            contextVariable={variable}
          />
        ))}
      </div>
    </>
  );
};
