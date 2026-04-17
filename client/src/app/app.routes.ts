import { Routes } from '@angular/router';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },

  // ── Business Owner Dashboard ──────────────────────────────────────────────
  {
    path: 'dashboard',
    children: [
      { path: '', redirectTo: 'jobs', pathMatch: 'full' },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./job-flow/dashboard/job-list/job-list').then(
            (m) => m.JobListComponent
          ),
      },
      {
        path: 'jobs/new',
        loadComponent: () =>
          import('./job-flow/dashboard/create-job/create-job').then(
            (m) => m.CreateJobComponent
          ),
      },
      {
        path: 'jobs/:id',
        loadComponent: () =>
          import('./job-flow/dashboard/job-detail/job-detail').then(
            (m) => m.JobDetailComponent
          ),
      },
    ],
  },

  // ── Customer-Facing Job Flow ──────────────────────────────────────────────
  {
    path: 'job/:id',
    loadComponent: () =>
      import('./job-flow/customer/job-landing/job-landing').then(
        (m) => m.JobLandingComponent
      ),
  },
  {
    path: 'job/:id/contract',
    loadComponent: () =>
      import('./job-flow/customer/contract/contract').then(
        (m) => m.ContractComponent
      ),
  },
  {
    path: 'job/:id/checkout',
    loadComponent: () =>
      import('./job-flow/customer/checkout/checkout').then(
        (m) => m.CheckoutComponent
      ),
  },
  {
    path: 'job/:id/confirmation',
    loadComponent: () =>
      import('./job-flow/customer/confirmation/confirmation').then(
        (m) => m.ConfirmationComponent
      ),
  },
  {
    path: 'job/:id/confirm',
    loadComponent: () =>
      import('./job-flow/customer/confirm/confirm').then(
        (m) => m.ConfirmComponent
      ),
  },

  // ── Public / Legal ───────────────────────────────────────────────────────────
  {
    path: 'sms-terms',
    loadComponent: () =>
      import('./sms-terms/sms-terms').then((m) => m.SmsTermsComponent),
  },

  { path: '**', redirectTo: '' },
];
