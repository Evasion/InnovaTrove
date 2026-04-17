import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JobService } from '../../shared/job.service';
import { Job, ProviderConfig, statusLabel } from '../../shared/job.model';

@Component({
  selector: 'app-job-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, MatButtonModule, MatCheckboxModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './job-landing.html',
})
export class JobLandingComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);

  jobId = this.route.snapshot.paramMap.get('id')!;
  job = signal<Job | null>(null);
  provider = signal<ProviderConfig | null>(null);
  loading = signal(true);
  error = signal('');
  smsConsentGiven = signal(false);
  proceeding = signal(false);

  statusLabel = statusLabel;

  constructor() {
    this.jobService.getJob(this.jobId).subscribe({
      next: ({ job, provider }) => {
        this.job.set(job);
        this.provider.set(provider);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('This link is invalid or has expired.');
      },
    });
  }

  proceed() {
    const status = this.job()?.status;
    if (status === 'link_sent') {
      // Record SMS consent before navigating to contract
      this.proceeding.set(true);
      this.jobService.recordConsent(this.jobId).subscribe({
        next: () => {
          this.proceeding.set(false);
          this.router.navigate(['/job', this.jobId, 'contract']);
        },
        error: () => {
          // Non-blocking — navigate even if consent recording fails
          this.proceeding.set(false);
          this.router.navigate(['/job', this.jobId, 'contract']);
        },
      });
    } else if (status === 'contract_signed') {
      this.router.navigate(['/job', this.jobId, 'checkout']);
    } else if (status === 'pending_confirmation') {
      this.router.navigate(['/job', this.jobId, 'confirm']);
    }
  }

  ctaLabel(): string {
    switch (this.job()?.status) {
      case 'link_sent': return 'Review Contract & Pay Deposit';
      case 'contract_signed': return 'Complete Payment';
      case 'deposit_paid': return 'Deposit Received — Service in Progress';
      case 'in_progress': return 'Service in Progress';
      case 'pending_confirmation': return 'Confirm Service Completion';
      case 'completed': return 'Service Complete — Thank You!';
      default: return 'Continue';
    }
  }

  ctaEnabled(): boolean {
    const s = this.job()?.status;
    if (s === 'link_sent') return this.smsConsentGiven();
    return s === 'contract_signed' || s === 'pending_confirmation';
  }
}
