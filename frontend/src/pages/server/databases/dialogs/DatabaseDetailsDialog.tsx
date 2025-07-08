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
    <Dialog title="Database connection details" onClose={onClose} open={open}>
      <Input.Label htmlFor="endpoint">Endpoint</Input.Label>
      <Input.Text id="endpoint" name="endpoint" value={database.connectionString} disabled />

      <Input.Label htmlFor="connectionsFrom">Connections From</Input.Label>
      <Input.Text id="connectionsFrom" name="connectionsFrom" value={database.allowConnectionsFrom} disabled />

      <Input.Label htmlFor="username">Username</Input.Label>
      <Input.Text id="username" name="username" value={database.username} disabled />

      <Input.Label htmlFor="password">Password</Input.Label>
      <Input.Text id="password" name="password" value={database.password} disabled />

      <Input.Label htmlFor="jdbcConnectionString">JDBC Connection String</Input.Label>
      <Input.Text id="jdbcConnectionString" name="jdbcConnectionString" value={jdbcConnectionString} disabled />

      <Dialog.Footer>
        <Button style={Button.Styles.Gray} onClick={onClose}>
          Close
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};
