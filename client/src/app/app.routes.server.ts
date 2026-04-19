import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'dashboard/jobs/:id', renderMode: RenderMode.Server },
  { path: 'job/:id', renderMode: RenderMode.Server },
  { path: 'job/:id/contract', renderMode: RenderMode.Server },
  { path: 'job/:id/checkout', renderMode: RenderMode.Server },
  { path: 'job/:id/confirmation', renderMode: RenderMode.Server },
  { path: 'job/:id/confirm', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender },
];
