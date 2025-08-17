import { httpErrorToHuman } from '@/api/axios';
import AdminSettingContainer from '@/elements/AdminSettingContainer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Dialog } from '@/elements/dialog';
import Code from '@/elements/Code';
import classNames from 'classnames';
import getDatabaseHost from '@/api/admin/databaseHosts/getDatabaseHost';
import updateDatabaseHost from '@/api/admin/databaseHosts/updateDatabaseHost';
import createDatabaseHost from '@/api/admin/databaseHosts/createDatabaseHost';
import deleteDatabaseHost from '@/api/admin/databaseHosts/deleteDatabaseHost';
import testDatabaseHost from '@/api/admin/databaseHosts/testDatabaseHost';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);
  const [databaseHost, setDatabaseHost] = useState<AdminUpdateDatabaseHost>({
    name: '',
    username: '',
    password: null,
    host: '',
    port: 3306,
    public: false,
    publicHost: null,
    publicPort: null,
    type: 'mysql',
  } as AdminUpdateDatabaseHost);

  useEffect(() => {
    if (params.id) {
      getDatabaseHost(params.id)
        .then((user) => {
          setDatabaseHost(user);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  const doCreateOrUpdate = () => {
    if (params?.id) {
      updateDatabaseHost(params.id, databaseHost)
        .then(() => {
          addToast('Database host updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } else {
      createDatabaseHost(databaseHost)
        .then((databaseHost) => {
          addToast('Database host created.', 'success');
          navigate(`/admin/database-hosts/${databaseHost.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  };

  const doTest = () => {
    testDatabaseHost(params.id)
      .then(() => {
        addToast('Test successfully completed', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDelete = () => {
    deleteDatabaseHost(params.id)
      .then(() => {
        addToast('Database host deleted.', 'success');
        navigate('/admin/database-hosts');
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
        title={'Confirm Database Host Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{databaseHost?.name}</Code>?
      </Dialog.Confirm>

      <div className={'mb-4'}>
        <h1 className={'text-4xl font-bold text-white'}>{params.id ? 'Update' : 'Create'} Database Host</h1>
      </div>
      <AdminSettingContainer title={'Database Host Settings'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'name'}>Name</Input.Label>
          <Input.Text
            id={'name'}
            placeholder={'Name'}
            value={databaseHost.name || ''}
            onChange={(e) => setDatabaseHost({ ...databaseHost, name: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'username'}>Username</Input.Label>
          <Input.Text
            id={'username'}
            placeholder={'Username'}
            value={databaseHost.username || ''}
            onChange={(e) => setDatabaseHost({ ...databaseHost, username: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'password'}>Password</Input.Label>
          <Input.Text
            id={'password'}
            placeholder={'Password'}
            type={'password'}
            value={databaseHost.password || ''}
            onChange={(e) => setDatabaseHost({ ...databaseHost, password: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'host'}>Host</Input.Label>
          <Input.Text
            id={'host'}
            placeholder={'Host'}
            value={databaseHost.host || ''}
            onChange={(e) => setDatabaseHost({ ...databaseHost, host: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'port'}>Port</Input.Label>
          <Input.Text
            id={'port'}
            placeholder={'Port'}
            type={'number'}
            value={databaseHost.port || ''}
            onChange={(e) => setDatabaseHost({ ...databaseHost, port: Number(e.target.value) })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Switch
            name={'public'}
            label={'Public'}
            checked={databaseHost.public}
            onChange={(e) => setDatabaseHost({ ...databaseHost, public: e.target.checked })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'publicHost'}>Public Host</Input.Label>
          <Input.Text
            id={'publicHost'}
            placeholder={'Public Host'}
            value={databaseHost.publicHost || ''}
            onChange={(e) => setDatabaseHost({ ...databaseHost, publicHost: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'publicPort'}>Public Port</Input.Label>
          <Input.Text
            id={'publicPort'}
            placeholder={'Public Port'}
            type={'number'}
            value={databaseHost.publicPort || ''}
            onChange={(e) => setDatabaseHost({ ...databaseHost, publicPort: Number(e.target.value) })}
          />
        </div>
        {!params.id && (
          <div className={'mt-4'}>
            <Input.Label htmlFor={'type'}>Type</Input.Label>
            <Input.Dropdown
              id={'type'}
              options={[
                { label: 'MySQL', value: 'mysql' },
                { label: 'PostgreSQL', value: 'postgres' },
              ]}
              selected={databaseHost.type || 'mysql'}
              onChange={(e) => setDatabaseHost({ ...databaseHost, type: e.target.value as DatabaseType })}
            />
          </div>
        )}

        <div className={classNames('mt-4 flex', params.id ? 'justify-between' : 'justify-end')}>
          {params.id && (
            <Button style={Button.Styles.Red} onClick={() => setOpenDialog('delete')}>
              Delete
            </Button>
          )}
          <div className={'flex gap-2'}>
            {params.id && (
              <Button onClick={doTest} style={Button.Styles.Gray}>
                Test
              </Button>
            )}
            <Button onClick={doCreateOrUpdate}>Save</Button>
          </div>
        </div>
      </AdminSettingContainer>
    </>
  );
};
