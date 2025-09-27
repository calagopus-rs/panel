import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import {
  faCodeCommit,
  faCog,
  faExternalLink,
  faFolder,
  faNetworkWired,
  faPaperPlane
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import getServer from '@/api/admin/servers/getServer';
import ServerCreateOrUpdate from './ServerCreateOrUpdate';
import AdminServerAllocations from '@/pages/admin/servers/allocations/AdminServerAllocations';
import AdminServerMounts from '@/pages/admin/servers/mounts/AdminServerMounts';
import AdminServerTransfer from '@/pages/admin/servers/transfer/AdminServerTransfer';
import AdminServerVariables from "@/pages/admin/servers/variables/AdminServerVariables";

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [server, setServer] = useState<AdminServer | null>(null);

  useEffect(() => {
    if (params.id) {
      getServer(params.id)
        .then((server) => {
          setServer(server);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !server ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{server.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/servers/${params.id}`,
          },
          {
            name: 'Allocations',
            icon: faNetworkWired,
            link: `/admin/servers/${params.id}/allocations`,
          },
          {
            name: 'Variables',
            icon: faCodeCommit,
            link: `/admin/servers/${params.id}/variables`,
          },
          {
            name: 'Mounts',
            icon: faFolder,
            link: `/admin/servers/${params.id}/mounts`,
          },
          {
            name: 'Transfer',
            icon: faPaperPlane,
            link: `/admin/servers/${params.id}/transfer`,
          },
          {
            name: 'View',
            icon: faExternalLink,
            link: `/server/${params.id}`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<ServerCreateOrUpdate contextServer={server} />} />
        <Route path={'/allocations'} element={<AdminServerAllocations server={server} />} />
        <Route path={'/variables'} element={<AdminServerVariables server={server} />} />
        <Route path={'/mounts'} element={<AdminServerMounts server={server} />} />
        <Route path={'/transfer'} element={<AdminServerTransfer server={server} />} />
      </Routes>
    </>
  );
};
