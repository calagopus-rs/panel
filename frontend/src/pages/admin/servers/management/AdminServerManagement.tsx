import { Grid, Title } from '@mantine/core';
import Card from '@/elements/Card';

export default ({ server }: { server: AdminServer }) => {
  return (
    <>
      <Grid>
        <Grid.Col span={3}>
          <Card>
            <Title order={2}>Transfer</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Title order={2}>Suspend</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Title order={2}>Delete</Title>
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
};
