import { Grid, Group, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import createEggVariable from '@/api/admin/nests/eggs/variables/createEggVariable';
import deleteEggVariable from '@/api/admin/nests/eggs/variables/deleteEggVariable';
import updateEggVariable from '@/api/admin/nests/eggs/variables/updateEggVariable';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import Code from '@/elements/Code';
import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import TagsInput from '@/elements/input/TagsInput';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function EggVariableContainer({
  contextNest,
  contextEgg,
  contextVariable,
}: {
  contextNest: AdminNest;
  contextEgg: AdminNestEgg;
  contextVariable?: NestEggVariable;
}) {
  const { addToast } = useToast();
  const { eggVariables, setEggVariables, addEggVariable, removeEggVariable } = useAdminStore();

  const [openModal, setOpenModal] = useState<'delete'>();
  const [loading, setLoading] = useState(false);
  const [variable, setVariable] = useState<UpdateNestEggVariable>({
    name: '',
    description: null,
    order: 0,
    envVariable: '',
    defaultValue: null,
    userViewable: true,
    userEditable: false,
    rules: [],
  });

  useEffect(() => {
    if (contextVariable) {
      setVariable({
        name: contextVariable.name,
        description: contextVariable.description,
        order: contextVariable.order,
        envVariable: contextVariable.envVariable,
        defaultValue: contextVariable.defaultValue,
        userViewable: contextVariable.userViewable,
        userEditable: contextVariable.userEditable,
        rules: contextVariable.rules,
      });
    }
  }, [contextVariable]);

  const doCreateOrUpdate = () => {
    setLoading(true);

    if (contextVariable?.uuid) {
      updateEggVariable(contextNest.uuid, contextEgg.uuid, contextVariable.uuid, variable)
        .then(() => {
          addToast('Egg variable updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      createEggVariable(contextNest.uuid, contextEgg.uuid, variable)
        .then((variable) => {
          addToast('Egg variable created.', 'success');
          addEggVariable(variable);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const doRemove = () => {
    if (contextVariable?.uuid) {
      deleteEggVariable(contextNest.uuid, contextEgg.uuid, contextVariable.uuid)
        .then(() => {
          removeEggVariable(contextVariable);
          addToast('Egg variable deleted.', 'success');
          setOpenModal(null);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } else {
      const varIndex = eggVariables.findIndex((v) => isEqual(v, variable));
      if (varIndex !== -1) {
        eggVariables.splice(varIndex, 1);
        setEggVariables([...eggVariables]);
      }
      addToast('Egg variable deleted.', 'success');
      setOpenModal(null);
    }
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Egg Variable Removal'
        confirm='Remove'
        onConfirmed={doRemove}
      >
        Are you sure you want to remove&nbsp;
        {variable.name && variable.envVariable ? (
          <Code>
            {variable.name} ({variable.envVariable})
          </Code>
        ) : (
          'this empty variable'
        )}
        ?
      </ConfirmationModal>
      <Card className='flex flex-col justify-between rounded-md p-4 h-full'>
        <Stack>
          <Grid>
            <Grid.Col span={10}>
              <TextInput
                withAsterisk
                label='Name'
                placeholder='Name'
                value={variable.name || ''}
                onChange={(e) => setVariable({ ...variable, name: e.target.value })}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <NumberInput
                withAsterisk
                label='Order'
                value={variable.order || 0}
                onChange={(value) => setVariable({ ...variable, order: Number(value) })}
              />
            </Grid.Col>
          </Grid>

          <TextArea
            label='Description'
            placeholder='Description'
            value={variable.description || ''}
            onChange={(e) => setVariable({ ...variable, description: e.target.value })}
          />

          <Group grow>
            <TextInput
              withAsterisk
              label='Environment Variable'
              placeholder='Environment Variable'
              value={variable.envVariable || ''}
              onChange={(e) => setVariable({ ...variable, envVariable: e.target.value.toUpperCase() })}
            />

            <TextInput
              withAsterisk
              label='Default Value'
              placeholder='server.jar'
              value={variable.defaultValue || ''}
              onChange={(e) => setVariable({ ...variable, defaultValue: e.target.value })}
            />
          </Group>

          <Group grow>
            <Switch
              label='User Viewable'
              name='user_viewable'
              checked={variable.userViewable}
              onChange={(e) => setVariable({ ...variable, userViewable: e.target.checked })}
            />

            <Switch
              label='User Editable'
              name='user_editable'
              checked={variable.userEditable}
              onChange={(e) => setVariable({ ...variable, userEditable: e.target.checked })}
            />
          </Group>

          <TagsInput
            label='Rules'
            value={variable.rules}
            onChange={(value) => setVariable({ ...variable, rules: value })}
          />
        </Stack>

        <Group pt='md' mt='auto'>
          <Button onClick={doCreateOrUpdate} loading={loading}>
            Save
          </Button>
          <Button color='red' variant='outline' onClick={() => setOpenModal('delete')}>
            Remove
          </Button>
        </Group>
      </Card>
    </>
  );
}
