import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobService } from '../../shared/job.service';
import { Job, ProviderConfig } from '../../shared/job.model';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CurrencyPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './confirm.html',
})
export class ConfirmComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);
  private snackBar = inject(MatSnackBar);

  jobId = this.route.snapshot.paramMap.get('id')!;
  job = signal<Job | null>(null);
  provider = signal<ProviderConfig | null>(null);
  loading = signal(true);
  confirming = signal(false);
  confirmed = signal(false);
  zelleInfo = signal('');
  remainingBalance = signal('');

  constructor() {
    this.jobService.getJob(this.jobId).subscribe({
      next: ({ job, provider }) => {
        this.job.set(job);
        this.provider.set(provider);
        this.loading.set(false);
        if (job.status === 'completed') {
          this.confirmed.set(true);
        } else if (job.status !== 'pending_confirmation') {
          this.router.navigate(['/job', this.jobId]);
        }
      },
      error: () => this.router.navigate(['/job', this.jobId]),
    });
  }

  confirm() {
    this.confirming.set(true);
    this.jobService.confirmCompletion(this.jobId).subscribe({
      next: ({ zelleInfo, remainingBalance }) => {
        this.confirming.set(false);
        this.zelleInfo.set(zelleInfo);
        this.remainingBalance.set(remainingBalance);
        this.confirmed.set(true);
      },
      error: (err) => {
        this.confirming.set(false);
        this.snackBar.open(err.error?.error || 'Something went wrong. Please try again.', 'Close', { duration: 4000 });
      },
    });
  }
}
