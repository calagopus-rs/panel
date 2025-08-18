import Sidebar from '@/elements/sidebar/Sidebar';
import { Route, Routes } from 'react-router';
import CollapsedIcon from '@/assets/pterodactyl.svg';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReply } from '@fortawesome/free-solid-svg-icons';
import routes, { to } from './routes';
import ErrorBoundary from '@/elements/ErrorBoundary';
import Container from '@/elements/Container';

export default () => {
  return (
    <div className={'lg:flex'}>
      <Sidebar collapsed={false}>
        <div className={'h-fit w-full flex flex-col items-center justify-center mt-1 select-none cursor-pointer'}>
          <img src={CollapsedIcon} className={'my-4 h-20'} alt={'Pterodactyl Icon'} />
        </div>
        <Sidebar.Section>
          <Sidebar.Link to={'/'} end>
            <FontAwesomeIcon icon={faReply} />
            <span>Back</span>
          </Sidebar.Link>
        </Sidebar.Section>
        <Sidebar.Section>
          {routes.admin
            .filter((route) => !!route.name)
            .map((route) => (
              <Sidebar.Link key={route.path} to={to(route.path, '/admin')} end={route.exact}>
                <FontAwesomeIcon icon={route.icon} />
                <span>{route.name}</span>
              </Sidebar.Link>
            ))}
        </Sidebar.Section>
        <Sidebar.User />
      </Sidebar>
      <div className={'max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0'}>
        <Container>
          <ErrorBoundary>
            <Routes>
              {routes.admin.map(({ path, element: Element }) => (
                <Route key={path} path={path} element={<Element />} />
              ))}
              <Route path={'*'} element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </Container>
      </div>
    </div>
  );
};
