/** biome-ignore-all lint/suspicious/noExplicitAny: this is a dynamic system */

import type { AdminRouteDefinition, GlobalRouteDefinition, RouteDefinition, ServerRouteDefinition } from '.';

class ExtensionSkip {
  protected __skip = 0xdeadbeeeeef;
}

export class ExtensionContext {
  public readonly extensions: Extension[];
  public readonly routes: ExtensionRoutesBuilder;

  constructor(extensions: Extension[]) {
    this.extensions = extensions;
    this.routes = new ExtensionRoutesBuilder();

    for (const extension of this.extensions) {
      try {
        extension.initialize(this);
      } catch (err) {
        console.error('Error while running module initialize function', extension.identifier, err);
      }

      this.routes.mergeFrom(extension.routes);
    }
  }

  public call(name: string, args: object): any {
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

export abstract class Extension {
  public abstract identifier: string;
  public abstract routes: ExtensionRoutesBuilder;

  // Your extension entrypoint, this runs when the page is loaded
  public abstract initialize(ctx: ExtensionContext): void;

  /**
   * Your extension call processor, this can be called by other extensions to interact with yours,
   * if the call does not apply to your extension, simply return `ctx.skip()` to continue the matching process.
   *
   * Optimally (if applies) make sure your calls are globally unique, for example by prepending them with `yourauthorname_yourextensioname_`
   */
  public abstract processCall(ctx: ExtensionContext, name: string, args: object): any;
}
