import { UseFormReturnType } from '@mantine/form';
import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { useNavigate } from 'react-router';

interface HasUuid {
  uuid: string;
}

interface UseResourceFormOptions<T, U extends HasUuid, CArgs = unknown, UArgs = unknown, DArgs = unknown> {
  form: UseFormReturnType<T>;
  createFn?: (args: CArgs) => Promise<U>;
  updateFn?: (args: UArgs) => Promise<void>;
  deleteFn?: (args: DArgs) => Promise<void>;
  doUpdate: boolean;
  toResetOnStay?: string[];
  basePath: string;
  resourceName: string;
}

interface UseResourceFormReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  doCreateOrUpdate: (stay: boolean) => void;
  doDelete: () => void;
}

export const useResourceForm = <T, U extends HasUuid, CArgs = unknown, UArgs = unknown, DArgs = unknown>(
  options: UseResourceFormOptions<T, U, CArgs, UArgs, DArgs>,
): UseResourceFormReturn => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { form, createFn, updateFn, deleteFn, doUpdate, toResetOnStay = [], basePath, resourceName } = options;

  const [loading, setLoading] = useState(false);

  const doCreateOrUpdate = (stay: boolean, args?: CArgs | UArgs) => {
    setLoading(true);

    if (doUpdate) {
      updateFn(args as UArgs)
        .then(() => {
          addToast(`${resourceName} updated.`, 'success');
        })
        .catch((msg) => addToast(httpErrorToHuman(msg), 'error'))
        .finally(() => setLoading(false));
    } else {
      createFn(args as CArgs)
        .then((result: U) => {
          addToast(`${resourceName} created.`, 'success');
          if (stay) {
            toResetOnStay.forEach((field) => form.resetField(field));
          } else if (result?.uuid) {
            navigate(`${basePath}/${result.uuid}`);
          }
        })
        .catch((msg) => addToast(httpErrorToHuman(msg), 'error'))
        .finally(() => setLoading(false));
    }
  };

  const doDelete = (args?: DArgs) =>
    deleteFn(args as DArgs)
      .then(() => {
        addToast(`${resourceName} deleted.`, 'success');
        navigate(basePath);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });

  return {
    loading,
    setLoading,
    doCreateOrUpdate,
    doDelete,
  };
};
