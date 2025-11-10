import { Group, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import getServerVariables from '@/api/admin/servers/variables/getServerVariables';
import updateServerVariables from '@/api/admin/servers/variables/updateServerVariables';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import VariableContainer from '@/elements/VariableContainer';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function AdminServerVariables({ server }: { server: AdminServer }) {
  const { addToast } = useToast();
  const { serverVariables, setServerVariables, updateServerVariable } = useAdminStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getServerVariables(server.uuid).then((data) => {
      setServerVariables(data);
    });
  }, []);

  const doUpdate = () => {
    load(true, setLoading);
    updateServerVariables(
      server.uuid,
      Object.entries(values).map(([envVariable, value]) => ({ envVariable, value })),
    )
      .then(() => {
        addToast('Server variables updated.', 'success');
        for (const [envVariable, value] of Object.entries(values)) {
          updateServerVariable(envVariable, { value });
        }

        setValues({});
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();

        if (Object.keys(values).length > 0 && !loading) {
          doUpdate();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [values, loading]);

  return (
    <>
      <Group justify={'space-between'} align={'start'} mb={'md'}>
        <Title order={2}>Server Variables</Title>
        <Group>
          <Button onClick={doUpdate} disabled={Object.keys(values).length === 0} loading={loading} color={'blue'}>
            Save
          </Button>
        </Group>
      </Group>

      <div className={'grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'}>
        {serverVariables.map((variable) => (
          <VariableContainer
            key={variable.envVariable}
            variable={variable}
            loading={loading}
            overrideReadonly
            value={values[variable.envVariable] ?? variable.value ?? variable.defaultValue ?? ''}
            setValue={(value) => setValues((prev) => ({ ...prev, [variable.envVariable]: value }))}
          />
        ))}
      </div>
    </>
  );
}
