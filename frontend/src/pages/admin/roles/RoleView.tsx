import { faCog, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getRole from '@/api/admin/roles/getRole';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import SubNavigation from '@/elements/SubNavigation';
import RoleCreateOrUpdate from '@/pages/admin/roles/RoleCreateOrUpdate';
import AdminRoleUsers from '@/pages/admin/roles/users/AdminRoleUsers';
import { useToast } from '@/providers/ToastProvider';

export default function RoleView() {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (params.id) {
      getRole(params.id)
        .then((role) => {
          setRole(role);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !role ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{role.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/roles/${params.id}`,
          },
          {
            name: 'Users',
            icon: faUsers,
            link: `/admin/roles/${params.id}/users`,
          },
        ]}
      />

      <Routes>
        <Route path='/' element={<RoleCreateOrUpdate contextRole={role} />} />
        <Route path='/users' element={<AdminRoleUsers role={role} />} />
      </Routes>
    </>
  );
}
