import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import getSchedule from '@/api/server/schedules/getSchedule';

export default () => {
  const params = useParams<'id'>();
  const server = useServerStore(state => state.data);

  const [schedule, setSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    getSchedule(server.id, Number(params.id)).then(setSchedule);
  }, [params.id]);

  return !schedule ? (
    <div className="w-full">
      <Spinner.Centered />
    </div>
  ) : (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">{schedule.name}</h1>
        <div className="flex gap-2">
          <Button>Save</Button>
        </div>
      </div>
    </Container>
  );
};
