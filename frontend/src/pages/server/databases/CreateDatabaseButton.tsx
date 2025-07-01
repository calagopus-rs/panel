import { httpErrorToHuman } from '@/api/axios';
import createDatabase from '@/api/server/databases/createDatabase';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useToast } from '@/elements/Toast';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';

export default () => {
  const server = useServerStore(state => state.data);
  const { addDatabase } = useServerStore(state => state.databases);
  const { addToast } = useToast();

  const [open, setOpen] = useState(false);
  const [dbName, setDbName] = useState('');
  const [connectionsFrom, setConnectionsFrom] = useState('');

  const submit = () => {
    createDatabase(server.id, { databaseName: dbName, connectionsFrom: connectionsFrom || '%' })
      .then(database => {
        addDatabase(database);
        setOpen(false);
        addToast('Database created.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Create Database'} onClose={() => setOpen(false)} open={open}>
        <Input.Label htmlFor={'dbName'}>Database Name</Input.Label>
        <Input.Text
          id={'dbName'}
          name={'dbName'}
          placeholder={'A descriptive name for your database.'}
          autoFocus
          onChange={e => setDbName(e.target.value)}
        />

        <Input.Label htmlFor={'connectionsFrom'}>Connections From</Input.Label>
        <Input.Text
          id={'connectionsFrom'}
          name={'connectionsFrom'}
          placeholder={'Where connections should be allowed from. Leave blank to allow connections from anywhere.'}
          onChange={e => setConnectionsFrom(e.target.value)}
        />
        <Dialog.Footer>
          <Button style={Button.Styles.Green} onClick={submit}>
            Create
          </Button>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button onClick={() => setOpen(true)}>Create new</Button>
    </>
  );
};
