import Container from '@/elements/Container';
import RenameContainer from './RenameContainer';
import TimezoneContainer from './TimezoneContainer';
import AutokillContainer from './AutokillContainer';
import ReinstallContainer from './ReinstallContainer';

export default () => {
  return (
    <Container>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Settings</h1>
      </div>
      <div className={'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'}>
        <RenameContainer />
        <AutokillContainer />
        <TimezoneContainer />
        <ReinstallContainer />
      </div>
    </Container>
  );
};
