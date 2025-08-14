import { httpErrorToHuman } from '@/api/axios';
import AdminSettingContainer from '@/elements/AdminSettingContainer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import createNest from '@/api/admin/nests/createNest';

export default () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [author, setAuthor] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const doCreate = () => {
    createNest({
      author,
      name,
      description,
    })
      .then((nest) => {
        addToast('Nest created.', 'success');
        navigate(`/admin/nests/${nest.id}`);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <div className={'mb-4'}>
        <h1 className={'text-4xl font-bold text-white'}>Create Nest</h1>
      </div>
      <AdminSettingContainer title={'Nest Settings'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'author'}>Author</Input.Label>
          <Input.Text id={'author'} placeholder={'Author'} value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'name'}>Name</Input.Label>
          <Input.Text id={'name'} placeholder={'Name'} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'description'}>Description</Input.Label>
          <Input.Text
            id={'description'}
            placeholder={'Description'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={'mt-4 flex justify-end'}>
          <Button onClick={doCreate}>Save</Button>
        </div>
      </AdminSettingContainer>
    </>
  );
};
