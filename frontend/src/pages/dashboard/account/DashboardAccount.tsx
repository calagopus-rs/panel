import Container from '@/elements/Container';
import PasswordContainer from './PasswordContainer';
import EmailContainer from './EmailContainer';
import TwoFactorContainer from './TwoFactorContainer';

export default () => {
  return (
    <Container>
      <div className={'grid lg:grid-cols-2 xl:grid-cols-3 gap-4'}>
        <PasswordContainer />
        <EmailContainer />
        <TwoFactorContainer />
      </div>
    </Container>
  );
};
