import ContentContainer from '@/elements/containers/ContentContainer.tsx';
import ScreenBlock from '@/elements/ScreenBlock.tsx';

export default function NotFound() {
  return (
    <ContentContainer title='Not Found'>
      <ScreenBlock title='404' description='Page not found' />
    </ContentContainer>
  );
}
