import { httpErrorToHuman } from '@/api/axios';
import AdminSettingContainer from '@/elements/AdminSettingContainer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Dialog } from '@/elements/dialog';
import Code from '@/elements/Code';
import getEgg from '@/api/admin/eggs/getEgg';
import deleteEgg from '@/api/admin/eggs/deleteEgg';
import updateEgg from '@/api/admin/eggs/updateEgg';
import createEgg from '@/api/admin/eggs/createEgg';

export default ({ nest }: { nest: Nest }) => {
  const params = useParams<'eggId'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [egg, setEgg] = useState<AdminNestEgg>({
    author: '',
    name: '',
    description: '',
    configFiles: [],
    configStartup: {
      done: [],
    },
    configStop: {
      type: '',
    },
    configScript: {
      container: '',
      entrypoint: '',
      content: '',
    },
    configAllocations: {
      userSelfAssign: {
        enabled: false,
        requirePrimaryAllocation: false,
        startPort: 0,
        endPort: 0,
      },
    },
    startup: '',
    forceOutgoingIp: false,
    features: [],
    dockerImages: {},
    fileDenylist: [],
  } as AdminNestEgg);
  const [openDialog, setOpenDialog] = useState<'delete'>(null);

  useEffect(() => {
    if (params.eggId) {
      getEgg(nest.id, Number(params.eggId))
        .then((egg) => {
          setEgg(egg);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.eggId]);

  const doCreateOrUpdate = () => {
    if (egg?.id) {
      updateEgg(nest.id, egg.id, egg)
        .then(() => {
          addToast('Egg updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } else {
      createEgg(nest.id, egg)
        .then((egg) => {
          addToast('Egg created.', 'success');
          navigate(`/admin/nests/${nest.id}/eggs/${egg.id}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  };

  const doDelete = () => {
    deleteEgg(nest.id, egg.id)
      .then(() => {
        addToast('Egg deleted.', 'success');
        navigate(`/admin/nests/${nest.id}/eggs`);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog.Confirm
        open={openDialog === 'delete'}
        hideCloseIcon
        onClose={() => setOpenDialog(null)}
        title={'Confirm Egg Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{egg?.name}</Code>?
      </Dialog.Confirm>

      <AdminSettingContainer title={'Egg Settings'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'author'}>Author</Input.Label>
          <Input.Text
            id={'author'}
            placeholder={'Author'}
            value={egg.author || ''}
            onChange={(e) => setEgg({ ...egg, author: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'name'}>Name</Input.Label>
          <Input.Text
            id={'name'}
            placeholder={'Name'}
            value={egg.name || ''}
            onChange={(e) => setEgg({ ...egg, name: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'description'}>Description</Input.Label>
          <Input.Textarea
            id={'description'}
            placeholder={'Description'}
            value={egg.description || ''}
            onChange={(e) => setEgg({ ...egg, description: e.target.value })}
          />
        </div>

        {/* TODO: configFiles */}

        <div className={'mt-4'}>
          <Input.Label htmlFor={'starupDone'}>Startup Done</Input.Label>
          <Input.MultiInput
            placeholder={'Message'}
            options={egg.configStartup?.done || []}
            onChange={(e) => setEgg({ ...egg, configStartup: { ...egg.configStartup, done: e } })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Switch
            name={'stripAnsi'}
            label={'Strip ansi from startup messages'}
            defaultChecked={egg.configStartup?.stripAnsi || false}
            onChange={(e) => setEgg({ ...egg, configStartup: { ...egg.configStartup, stripAnsi: e.target.checked } })}
          />
        </div>

        {/* TODO: configStop */}

        <div className={'mt-4'}>
          <Input.Label htmlFor={'scriptContainer'}>Script Container</Input.Label>
          <Input.Text
            id={'scriptContainer'}
            placeholder={'Script Container'}
            value={egg.configScript?.container || ''}
            onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, container: e.target.value } })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'scriptEntrypoint'}>Script Entrypoint</Input.Label>
          <Input.Text
            id={'scriptEntrypoint'}
            placeholder={'Script Entrypoint'}
            value={egg.configScript?.entrypoint || ''}
            onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, entrypoint: e.target.value } })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'scriptContent'}>Script Content</Input.Label>
          <Input.Textarea
            id={'scriptContent'}
            placeholder={'Script Content'}
            value={egg.configScript?.content || ''}
            onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, content: e.target.value } })}
            rows={10}
          />
        </div>

        <div className={'mt-4'}>
          <Input.Switch
            name={'allocationSelfAssign'}
            label={'Allocation Self Assign'}
            defaultChecked={egg.configAllocations?.userSelfAssign?.enabled || false}
            onChange={(e) =>
              setEgg({
                ...egg,
                configAllocations: {
                  ...egg.configAllocations,
                  userSelfAssign: { ...egg.configAllocations.userSelfAssign, enabled: e.target.checked },
                },
              })
            }
          />
        </div>
        <div className={'mt-4'}>
          <Input.Switch
            name={'requirePrimaryAllocation'}
            label={'Require Primary Allocation'}
            defaultChecked={egg.configAllocations?.userSelfAssign?.requirePrimaryAllocation || false}
            onChange={(e) =>
              setEgg({
                ...egg,
                configAllocations: {
                  ...egg.configAllocations,
                  userSelfAssign: {
                    ...egg.configAllocations.userSelfAssign,
                    requirePrimaryAllocation: e.target.checked,
                  },
                },
              })
            }
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'allocationAutoStart'}>Automatic Allocation Start</Input.Label>
          <Input.Text
            id={'allocationAutoStart'}
            placeholder={'Automatic Allocation Start'}
            type={'number'}
            value={egg.configAllocations?.userSelfAssign?.startPort || 0}
            onChange={(e) =>
              setEgg({
                ...egg,
                configAllocations: {
                  ...egg.configAllocations,
                  userSelfAssign: { ...egg.configAllocations.userSelfAssign, startPort: Number(e.target.value) },
                },
              })
            }
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'allocationAutoEnd'}>Automatic Allocation End</Input.Label>
          <Input.Text
            id={'allocationAutoEnd'}
            placeholder={'Automatic Allocation End'}
            type={'number'}
            value={egg.configAllocations?.userSelfAssign?.endPort || 0}
            onChange={(e) =>
              setEgg({
                ...egg,
                configAllocations: {
                  ...egg.configAllocations,
                  userSelfAssign: { ...egg.configAllocations.userSelfAssign, endPort: Number(e.target.value) },
                },
              })
            }
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'startup'}>Startup</Input.Label>
          <Input.Text
            id={'startup'}
            placeholder={'Startup'}
            value={egg.startup}
            onChange={(e) => setEgg({ ...egg, startup: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Switch
            name={'forceOutgoingIp'}
            label={'Force Outgoing IP'}
            defaultChecked={egg.forceOutgoingIp || false}
            onChange={(e) => setEgg({ ...egg, forceOutgoingIp: e.target.checked })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'features'}>Features</Input.Label>
          <Input.MultiInput
            placeholder={'Feature'}
            options={egg.features || []}
            onChange={(e) => setEgg({ ...egg, features: e })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'dockerImages'}>Docker Images</Input.Label>
          <Input.MultiKeyValueInput
            options={egg.dockerImages || {}}
            onChange={(e) => setEgg({ ...egg, dockerImages: e })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'fileDenyList'}>File Deny List</Input.Label>
          <Input.MultiInput
            placeholder={'Denied File'}
            options={egg.fileDenylist || []}
            onChange={(e) => setEgg({ ...egg, fileDenylist: e })}
          />
        </div>

        <div className={'mt-4 flex justify-between'}>
          {params.eggId && (
            <Button style={Button.Styles.Red} onClick={() => setOpenDialog('delete')}>
              Delete
            </Button>
          )}
          <Button onClick={doCreateOrUpdate}>Save</Button>
        </div>
      </AdminSettingContainer>
    </>
  );
};
