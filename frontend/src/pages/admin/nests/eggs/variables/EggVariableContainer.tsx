import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createEggVariable from '@/api/admin/nests/eggs/variables/createEggVariable.ts';
import deleteEggVariable from '@/api/admin/nests/eggs/variables/deleteEggVariable.ts';
import updateEggVariable from '@/api/admin/nests/eggs/variables/updateEggVariable.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import Code from '@/elements/Code.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TagsInput from '@/elements/input/TagsInput.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { adminEggVariableSchema } from '@/lib/schemas/admin/eggs.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';

export default function EggVariableContainer({
  contextNest,
  contextEgg,
  contextVariable,
}: {
  contextNest: AdminNest;
  contextEgg: AdminNestEgg;
  contextVariable?: NestEggVariable;
}) {
  const { eggVariables, setEggVariables, removeEggVariable } = useAdminStore();
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'delete' | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminEggVariableSchema>>({
    initialValues: {
      name: '',
      description: null,
      order: 0,
      envVariable: '',
      defaultValue: null,
      userViewable: true,
      userEditable: false,
      secret: false,
      rules: [],
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminEggVariableSchema),
  });

  useEffect(() => {
    if (contextVariable) {
      form.setValues({
        name: contextVariable.name,
        description: contextVariable.description,
        order: contextVariable.order,
        envVariable: contextVariable.envVariable,
        defaultValue: contextVariable.defaultValue,
        userViewable: contextVariable.userViewable,
        userEditable: contextVariable.userEditable,
        secret: contextVariable.isSecret,
        rules: contextVariable.rules,
      });
    }
  }, [contextVariable]);

  const doCreateOrUpdate = () => {
    setLoading(true);

    if (contextVariable?.uuid) {
      updateEggVariable(contextNest.uuid, contextEgg.uuid, contextVariable.uuid, form.values)
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
      createEggVariable(contextNest.uuid, contextEgg.uuid, form.values)
        .then((variable) => {
          setEggVariables([...eggVariables.filter((v) => v.uuid || v.order !== contextVariable!.order), variable]);
          addToast('Egg variable created.', 'success');
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
      setEggVariables(eggVariables.filter((v) => v.uuid || v.order !== contextVariable!.order));
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
        {form.values.name && form.values.envVariable ? (
          <Code>
            {form.values.name} ({form.values.envVariable})
          </Code>
        ) : (
          'this empty variable'
        )}
        ?
      </ConfirmationModal>

      <Card className='flex flex-col justify-between h-full'>
        <form onSubmit={form.onSubmit(doCreateOrUpdate)}>
          <Stack>
            <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />

            <TextArea
              label='Description'
              placeholder='Description'
              description='Supports Markdown formatting.'
              {...form.getInputProps('description')}
            />

            <Group grow>
              <TextInput
                withAsterisk
                label='Environment Variable'
                placeholder='Environment Variable'
                {...form.getInputProps('envVariable')}
                onChange={(e) => form.setFieldValue('envVariable', e.target.value.toUpperCase().replace(/-| /g, '_'))}
              />

              <TextInput label='Default Value' placeholder='server.jar' {...form.getInputProps('defaultValue')} />
            </Group>

            <Group grow>
              <Switch
                label='User Viewable'
                name='user_viewable'
                {...form.getInputProps('userViewable', { type: 'checkbox' })}
              />

              <Switch
                label='User Editable'
                name='user_editable'
                {...form.getInputProps('userEditable', { type: 'checkbox' })}
              />
            </Group>

            <Switch label='Secret' name='secret' {...form.getInputProps('secret', { type: 'checkbox' })} />

            <TagsInput
              label='Rules'
              placeholder='Rules'
              description='Inspired by https://laravel.com/docs/12.x/validation#available-validation-rules'
              {...form.getInputProps('rules')}
            />
          </Stack>

          <Group pt='md' mt='auto'>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              Save
            </Button>
            <Button color='red' variant='outline' onClick={() => setOpenModal('delete')}>
              Remove
            </Button>
          </Group>
        </form>
      </Card>
    </>
  );
}
