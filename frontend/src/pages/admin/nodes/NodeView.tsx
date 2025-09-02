import { Route, Routes, useParams } from 'react-router';
import { SubNavigation, SubNavigationLink } from '@/elements/SubNavigation';
import { faCog, faExternalLink, faInfoCircle, faNetworkWired } from '@fortawesome/free-solid-svg-icons';
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

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [node, setNode] = useState<Node | null>(null);

  useEffect(() => {
    if (params.id) {
      getNode(params.id)
        .then((location) => {
          setNode(location);
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

      <SubNavigation>
        <SubNavigationLink to={`/admin/nodes/${params.id}`} name={'General'} icon={faCog} />
        <SubNavigationLink
          to={`/admin/nodes/${params.id}/statistics`}
          name={'Statistics'}
          icon={faInfoCircle}
          end={false}
        />
        <SubNavigationLink
          to={`/admin/nodes/${params.id}/allocations`}
          name={'Allocations'}
          icon={faNetworkWired}
          end={false}
        />
        <SubNavigationLink to={`/admin/nodes/${params.id}/mounts`} name={'Mounts'} icon={faExternalLink} end={false} />
      </SubNavigation>

      <Routes>
        <Route path={'/'} element={<NodeCreateOrUpdate contextNode={node} />} />
        <Route path={'/statistics'} element={<AdminNodeStatistics node={node} />} />
        <Route path={'/allocations'} element={<AdminNodeAllocations node={node} />} />
        <Route path={'/mounts'} element={<AdminNodeMounts node={node} />} />
      </Routes>
    </>
  );
};
