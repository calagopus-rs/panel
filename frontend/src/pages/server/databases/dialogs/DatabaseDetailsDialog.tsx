import { Button } from '@/elements/button';
import { Dialog, DialogProps } from '@/elements/dialog';
import { Input } from '@/elements/inputs';

type Props = DialogProps & {
  database: ServerDatabase;
};

export default ({ database, open, onClose }: Props) => {
  const jdbcConnectionString = `jdbc:mysql://${database.username}${
    database.password ? `:${encodeURIComponent(database.password)}` : ''
  }@${database.connectionString}/${database.name}`;

  return (
    <Dialog title={'Database connection details'} onClose={onClose} open={open}>
      <label htmlFor={'endpoint'} className={'block mt-3'}>
        Endpoint
      </label>
      <Input.Text id={'endpoint'} name={'endpoint'} value={database.connectionString} disabled />

      <label htmlFor={'connectionsFrom'} className={'block mt-3'}>
        Connections From
      </label>
      <Input.Text id={'connectionsFrom'} name={'connectionsFrom'} value={database.allowConnectionsFrom} disabled />

      <label htmlFor={'username'} className={'block mt-3'}>
        Username
      </label>
      <Input.Text id={'username'} name={'username'} value={database.username} disabled />

      <label htmlFor={'password'} className={'block mt-3'}>
        Password
      </label>
      <Input.Text id={'password'} name={'password'} value={database.password} disabled />

      <label htmlFor={'jdbcConnectionString'} className={'block mt-3'}>
        JDBC Connection String
      </label>
      <Input.Text id={'jdbcConnectionString'} name={'jdbcConnectionString'} value={jdbcConnectionString} disabled />

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
