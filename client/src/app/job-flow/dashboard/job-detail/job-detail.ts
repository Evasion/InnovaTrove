import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe, DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobService } from '../../shared/job.service';
import { Job, statusLabel, statusClasses } from '../../shared/job.model';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './job-detail.html',
})
export class JobDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);
  private snackBar = inject(MatSnackBar);
  private doc = inject(DOCUMENT);

  jobId = this.route.snapshot.paramMap.get('id')!;
  job = signal<Job | null>(null);
  loading = signal(true);
  actionLoading = signal(false);

  statusLabel = statusLabel;
  statusClasses = statusClasses;

  constructor() {
    this.load();
  }

  private load() {
    this.jobService.getJob(this.jobId).subscribe({
      next: ({ job }) => {
        this.job.set(job);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Job not found.', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard/jobs']);
      },
    });
  }

  markComplete() {
    this.actionLoading.set(true);
    this.jobService.markComplete(this.jobId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.snackBar.open('Job marked complete. Customer notified via SMS.', 'Close', {
          duration: 4000,
        });
        this.load();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.snackBar.open(err.error?.error || 'Failed to update job.', 'Close', {
          duration: 4000,
        });
      },
    });
  }

  copyLink() {
    const url = `${this.doc.location.origin}/job/${this.jobId}`;
    navigator.clipboard.writeText(url);
    this.snackBar.open('Customer link copied!', '', { duration: 2000 });
  }

  back() {
    this.router.navigate(['/dashboard/jobs']);
  }

  canMarkComplete(): boolean {
    const s = this.job()?.status;
    return s === 'deposit_paid' || s === 'in_progress';
  }
}
