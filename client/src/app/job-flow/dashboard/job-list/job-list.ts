import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobService } from '../../shared/job.service';
import { Job, statusLabel, statusClasses } from '../../shared/job.model';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './job-list.html',
})
export class JobListComponent {
  private jobService = inject(JobService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  jobs = signal<Job[]>([]);
  loading = signal(true);
  error = signal('');

  statusLabel = statusLabel;
  statusClasses = statusClasses;

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.jobService.listJobs().subscribe({
      next: ({ jobs }) => {
        this.jobs.set(jobs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load jobs. Is the server running?');
      },
    });
  }

  view(jobId: string) {
    this.router.navigate(['/dashboard/jobs', jobId]);
  }

  create() {
    this.router.navigate(['/dashboard/jobs/new']);
  }

  copyLink(jobId: string, event: Event) {
    event.stopPropagation();
    const url = `${window.location.origin}/job/${jobId}`;
    navigator.clipboard.writeText(url);
    this.snackBar.open('Link copied!', '', { duration: 2000 });
  }
}
