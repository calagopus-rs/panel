import { Group, Title } from "@mantine/core";
import VariableContainer from "@/elements/VariableContainer";
import { useAdminStore } from "@/stores/admin";
import { load } from "@/lib/debounce";
import { httpErrorToHuman } from "@/api/axios";
import updateServerVariable from "@/api/admin/servers/variables/updateServerVariable";
import { useToast } from "@/providers/ToastProvider";
import { useEffect } from "react";
import getServerVariables from "@/api/admin/servers/variables/getServerVariables";

export default ({ server }: { server: AdminServer }) => {
  const { addToast } = useToast();
  const { serverVariables, setServerVariables, updateServerVariable: updateServerStoreVariable } = useAdminStore();


  useEffect(() => {
    getServerVariables(server.uuid).then((data) => {
      setServerVariables(data);
    });
  }, []);

  const doUpdate = (setLoading: (loading: boolean) => void, variable: ServerVariable, value: string) => {
    load(true, setLoading);
    updateServerVariable(server.uuid, { envVariable: variable.envVariable, value })
      .then(() => {
        addToast('Server variable updated.', 'success');
        updateServerStoreVariable(variable.envVariable, { value });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <>
      <Group mb={"md"}>
        <Title order={2}>
          Server Variables
        </Title>
      </Group>
      <div className={'grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'}>
        {serverVariables.map((variable) => (
          <VariableContainer key={variable.envVariable} variable={variable} overrideReadonly doUpdate={doUpdate} />
        ))}
      </div>
    </>
  );
}
