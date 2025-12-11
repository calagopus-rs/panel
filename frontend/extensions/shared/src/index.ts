import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import type { FC } from 'react';

export interface GlobalRouteDefinition {
  path: string;
  filter?: () => boolean;
  element: FC;
  exact?: boolean;
}

export interface RouteDefinition extends GlobalRouteDefinition {
  name: string | (() => string) | undefined;
  icon?: IconDefinition;
}

export interface AdminRouteDefinition extends RouteDefinition {
  permission?: string | string[] | null;
}

export interface ServerRouteDefinition extends RouteDefinition {
  permission?: string | string[] | null;
}

export * from './extension';
export * from './translation';
