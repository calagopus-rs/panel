import { httpErrorToHuman } from '@/api/axios';
import renameServer from '@/api/server/settings/renameServer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { server } = useServerStore();

  const [name, setName] = useState(server.name);
  const [description, setDescription] = useState(server.description || '');

  const handleUpdate = () => {
    renameServer(server.uuid, { name, description })
      .then(() => {
        addToast('Server renamed.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <div className={'bg-gray-700/50 rounded-md p-4 h-fit'}>
      <h1 className={'text-4xl font-bold text-white'}>Rename Server</h1>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'name'}>Name</Input.Label>
        <Input.Text
          id={'name'}
          placeholder={'Name'}
          type={'text'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'description'}>Description</Input.Label>
        <Input.Textarea
          id={'description'}
          placeholder={'Description'}
          value={description}
          rows={3}
          style={{ resize: 'none' }}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className={'mt-4 flex justify-end'}>
        <Button disabled={!name} onClick={handleUpdate}>
          Rename Server
        </Button>
      </div>
    </div>
  );
};
