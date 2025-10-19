import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import {
  faCog,
  faExternalLink,
  faFileLines,
  faInfoCircle,
  faNetworkWired,
  faPenRuler,
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import NodeCreateOrUpdate from './NodeCreateOrUpdate';
import getNode from '@/api/admin/nodes/getNode';
import AdminNodeMounts from './mounts/AdminNodeMounts';
import AdminNodeStatistics from './statistics/AdminNodeStatistics';
import AdminNodeAllocations from './allocations/AdminNodeAllocations';
import AdminNodeConfiguration from './configuration/AdminNodeConfiguration';
import AdminNodeLogs from './logs/AdminNodeLogs';

export default () => {
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
        ]}
      />

      <Routes>
        <Route path={'/'} element={<NodeCreateOrUpdate contextNode={node} />} />
        <Route path={'/configuration'} element={<AdminNodeConfiguration node={node} />} />
        <Route path={'/statistics'} element={<AdminNodeStatistics node={node} />} />
        <Route path={'/logs'} element={<AdminNodeLogs node={node} />} />
        <Route path={'/allocations'} element={<AdminNodeAllocations node={node} />} />
        <Route path={'/mounts'} element={<AdminNodeMounts node={node} />} />
      </Routes>
    </>
  );
};
