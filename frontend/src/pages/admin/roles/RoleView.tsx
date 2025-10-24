import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import { faCog, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import RoleCreateOrUpdate from '@/pages/admin/roles/RoleCreateOrUpdate';
import AdminRoleUsers from '@/pages/admin/roles/users/AdminRoleUsers';
import getRole from '@/api/admin/roles/getRole';

export default () => {
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

  return !location ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{location.name}</Title>

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
        <Route path={'/'} element={<RoleCreateOrUpdate contextRole={role} />} />
        <Route path={'/users'} element={<AdminRoleUsers role={role} />} />
      </Routes>
    </>
  );
};
