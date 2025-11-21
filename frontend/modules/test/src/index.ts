import { Extension, ExtensionContext, ExtensionRoutesBuilder } from 'shared';
import JohnPorkPage from './Page';
import { faPiggyBank } from '@fortawesome/free-solid-svg-icons';

class TestExtension extends Extension {
  public identifier: string;
  public routes: ExtensionRoutesBuilder = new ExtensionRoutesBuilder()
    .addAccountRoute({
      name: 'John Pork',
      icon: faPiggyBank,
      path: '/john-pork',
      element: JohnPorkPage,
    })
    .addServerRoute({
      name: 'John Pork Server',
      icon: faPiggyBank,
      path: '/john-pork',
      element: JohnPorkPage,
    });

  public initialize(ctx: ExtensionContext): void {
    console.log('Hello from test extension!!!');
  }

  public processCall(ctx: ExtensionContext, name: string, args: object) {
    return ctx.skip();
  }
}

export default new TestExtension();
