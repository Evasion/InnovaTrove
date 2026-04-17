import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JobService } from '../../shared/job.service';
import { Job, ProviderConfig } from '../../shared/job.model';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CurrencyPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './confirmation.html',
})
export class ConfirmationComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);

  jobId = this.route.snapshot.paramMap.get('id')!;
  job = signal<Job | null>(null);
  provider = signal<ProviderConfig | null>(null);
  loading = signal(true);

  constructor() {
    this.jobService.getJob(this.jobId).subscribe({
      next: ({ job, provider }) => {
        this.job.set(job);
        this.provider.set(provider);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/job', this.jobId]);
      },
    });
  }
}
