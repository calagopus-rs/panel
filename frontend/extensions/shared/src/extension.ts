import type { ReactNode } from 'react';
import type { AdminRouteDefinition, GlobalRouteDefinition, RouteDefinition, ServerRouteDefinition } from '.';

class ExtensionSkip {
  protected __skip = 0xdeadbeeeeef;
}

export class ExtensionContext {
  public readonly extensions: Extension[];
  public readonly routes: ExtensionRoutesBuilder;
  public readonly permissionIcons: ExtensionPermissionIconsBuilder;

  constructor(extensions: Extension[]) {
    this.extensions = extensions;
    this.routes = new ExtensionRoutesBuilder();
    this.permissionIcons = new ExtensionPermissionIconsBuilder();

    for (const extension of this.extensions) {
      try {
        extension.initialize(this);
      } catch (err) {
        console.error('Error while running module initialize function', extension.packageName, err);
      }

      this.routes.mergeFrom(extension.routes);
      this.permissionIcons.mergeFrom(extension.permissionIcons);
    }
  }

  public call(name: string, args: object): unknown {
    for (const extension of this.extensions) {
      const result = extension.processCall(this, name, args);

      if (!(result instanceof ExtensionSkip)) {
        return result;
      }
    }

    return null;
  }

  // Skips the current call process iteration
  public skip() {
    return new ExtensionSkip();
  }
}

export class ExtensionRoutesBuilder {
  public globalRoutes: GlobalRouteDefinition[] = [];
  public authenticationRoutes: GlobalRouteDefinition[] = [];
  public accountRoutes: RouteDefinition[] = [];
  public adminRoutes: AdminRouteDefinition[] = [];
  public serverRoutes: ServerRouteDefinition[] = [];

  public mergeFrom(other: this): this {
    this.globalRoutes.push(...other.globalRoutes);
    this.authenticationRoutes.push(...other.authenticationRoutes);
    this.accountRoutes.push(...other.accountRoutes);
    this.adminRoutes.push(...other.adminRoutes);
    this.serverRoutes.push(...other.serverRoutes);

    return this;
  }

  public addGlobalRoute(route: GlobalRouteDefinition): this {
    this.globalRoutes.push(route);

    return this;
  }

  public addAuthenticationRoute(route: GlobalRouteDefinition): this {
    this.authenticationRoutes.push(route);

    return this;
  }

  public addAccountRoute(route: RouteDefinition): this {
    this.accountRoutes.push(route);

    return this;
  }

  public addAdminRoute(route: AdminRouteDefinition): this {
    this.adminRoutes.push(route);

    return this;
  }

  public addServerRoute(route: ServerRouteDefinition): this {
    this.serverRoutes.push(route);

    return this;
  }
}

export class ExtensionPermissionIconsBuilder {
  public userPermissionIcons: Record<string, ReactNode> = {};
  public adminPermissionIcons: Record<string, ReactNode> = {};
  public serverPermissionIcons: Record<string, ReactNode> = {};

  public mergeFrom(other: this): this {
    for (const [k, v] of Object.entries(other.userPermissionIcons)) {
      this.userPermissionIcons[k] = v;
    }
    for (const [k, v] of Object.entries(other.adminPermissionIcons)) {
      this.adminPermissionIcons[k] = v;
    }
    for (const [k, v] of Object.entries(other.serverPermissionIcons)) {
      this.serverPermissionIcons[k] = v;
    }

    return this;
  }

  public addUserPermissionIcon(group: string, icon: ReactNode): this {
    this.userPermissionIcons[group] = icon;

    return this;
  }

  public addAdminPermissionIcon(group: string, icon: ReactNode): this {
    this.adminPermissionIcons[group] = icon;

    return this;
  }

  public addServerPermissionIcon(group: string, icon: ReactNode): this {
    this.serverPermissionIcons[group] = icon;

    return this;
  }
}

export class Extension {
  public packageName: string = '';
  public routes: ExtensionRoutesBuilder = new ExtensionRoutesBuilder();
  public permissionIcons: ExtensionPermissionIconsBuilder = new ExtensionPermissionIconsBuilder();

  // Your extension entrypoint, this runs when the page is loaded
  public initialize(ctx: ExtensionContext): void {
    // to be implemented
  }

  /**
   * Your extension call processor, this can be called by other extensions to interact with yours,
   * if the call does not apply to your extension, simply return `ctx.skip()` to continue the matching process.
   *
   * Optimally (if applies) make sure your calls are globally unique, for example by prepending them with `yourauthorname_yourextensioname_`
   */
  public processCall(ctx: ExtensionContext, name: string, args: object): unknown {
    return ctx.skip();
  }
}
