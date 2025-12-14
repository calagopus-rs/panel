import {
  faCog,
  faComputer,
  faExternalLink,
  faFileLines,
  faInfoCircle,
  faNetworkWired,
  faPenRuler,
} from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getNode from '@/api/admin/nodes/getNode.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Spinner from '@/elements/Spinner.tsx';
import SubNavigation from '@/elements/SubNavigation.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import AdminNodeAllocations from './allocations/AdminNodeAllocations.tsx';
import AdminNodeConfiguration from './configuration/AdminNodeConfiguration.tsx';
import AdminNodeLogs from './logs/AdminNodeLogs.tsx';
import AdminNodeMounts from './mounts/AdminNodeMounts.tsx';
import NodeCreateOrUpdate from './NodeCreateOrUpdate.tsx';
import AdminNodeStatistics from './statistics/AdminNodeStatistics.tsx';
import AdminNodeServers from './servers/AdminNodeServers.tsx';

export default function NodeView() {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [node, setNode] = useState<Node | null>(null);

  useEffect(() => {
    if (params.id) {
      getNode(params.id)
        .then((node) => {
          setNode(node);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !node ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{node.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/nodes/${params.id}`,
          },
          {
            name: 'Configuration',
            icon: faPenRuler,
            link: `/admin/nodes/${params.id}/configuration`,
          },
          {
            name: 'Statistics',
            icon: faInfoCircle,
            link: `/admin/nodes/${params.id}/statistics`,
          },
          {
            name: 'Logs',
            icon: faFileLines,
            link: `/admin/nodes/${params.id}/logs`,
          },
          {
            name: 'Allocations',
            icon: faNetworkWired,
            link: `/admin/nodes/${params.id}/allocations`,
          },
          {
            name: 'Mounts',
            icon: faExternalLink,
            link: `/admin/nodes/${params.id}/mounts`,
          },
          {
            name: 'Servers',
            icon: faComputer,
            link: `/admin/nodes/${params.id}/servers`,
          },
        ]}
      />

      <Routes>
        <Route path='/' element={<NodeCreateOrUpdate contextNode={node} />} />
        <Route path='/configuration' element={<AdminNodeConfiguration node={node} />} />
        <Route path='/statistics' element={<AdminNodeStatistics node={node} />} />
        <Route path='/logs' element={<AdminNodeLogs node={node} />} />
        <Route path='/allocations' element={<AdminNodeAllocations node={node} />} />
        <Route path='/mounts' element={<AdminNodeMounts node={node} />} />
        <Route path='/servers' element={<AdminNodeServers node={node} />} />
      </Routes>
    </>
  );
}
