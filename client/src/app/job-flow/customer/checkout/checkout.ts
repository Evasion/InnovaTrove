import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JobService } from '../../shared/job.service';
import { Job, ProviderConfig } from '../../shared/job.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CurrencyPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './checkout.html',
})
export class CheckoutComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);
  private platformId = inject(PLATFORM_ID);

  jobId = this.route.snapshot.paramMap.get('id')!;
  job = signal<Job | null>(null);
  provider = signal<ProviderConfig | null>(null);
  loading = signal(true);
  paying = signal(false);
  error = signal('');

  constructor() {
    this.jobService.getJob(this.jobId).subscribe({
      next: ({ job, provider }) => {
        this.job.set(job);
        this.provider.set(provider);
        this.loading.set(false);
        if (job.status !== 'contract_signed') {
          this.router.navigate(['/job', this.jobId]);
        }
      },
      error: () => this.router.navigate(['/job', this.jobId]),
    });
  }

  pay() {
    this.paying.set(true);
    this.error.set('');
    this.jobService.createCheckout(this.jobId).subscribe({
      next: ({ checkoutUrl }) => {
        if (isPlatformBrowser(this.platformId)) {
          window.location.href = checkoutUrl;
        }
      },
      error: (err) => {
        this.paying.set(false);
        this.error.set(err.error?.error || 'Payment setup failed. Please try again.');
      },
    });
  }

  back() {
    this.router.navigate(['/job', this.jobId]);
  }
}
