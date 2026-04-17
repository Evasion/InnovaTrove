import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobService } from '../../shared/job.service';

function depositNotExceedTotal(group: AbstractControl): ValidationErrors | null {
  const total = parseFloat(group.get('totalAmount')?.value);
  const deposit = parseFloat(group.get('depositAmount')?.value);
  if (!isNaN(total) && !isNaN(deposit) && deposit > total) {
    return { depositExceedsTotal: true };
  }
  return null;
}

function timeSlotBothOrNeither(group: AbstractControl): ValidationErrors | null {
  const start = group.get('timeSlotStart')?.value;
  const end = group.get('timeSlotEnd')?.value;
  if ((start && !end) || (!start && end)) {
    return { timeSlotIncomplete: true };
  }
  return null;
}

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './create-job.html',
})
export class CreateJobComponent {
  private fb = inject(FormBuilder);
  private jobService = inject(JobService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  loading = signal(false);
  createdJob = signal<{ jobId: string; jobUrl: string } | null>(null);

  form: FormGroup = this.fb.group(
    {
      customerPhone: ['', [Validators.required]],
      customerName: [''],
      serviceDescription: ['', [Validators.required, Validators.minLength(10)]],
      totalAmount: ['', [Validators.required, Validators.min(1)]],
      depositAmount: ['', [Validators.required, Validators.min(1)]],
      scheduledDate: [''],
      timeSlotStart: [''],
      timeSlotEnd: [''],
      ownerConsentConfirmed: [false, [Validators.requiredTrue]],
    },
    { validators: [depositNotExceedTotal, timeSlotBothOrNeither] }
  );

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.jobService.createJob(this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.createdJob.set({ jobId: res.jobId, jobUrl: res.jobUrl });
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(
          err.error?.error || 'Failed to create job. Check your connection.',
          'Close',
          { duration: 5000 }
        );
      },
    });
  }

  copyLink() {
    const url = this.createdJob()?.jobUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      this.snackBar.open('Link copied to clipboard!', '', { duration: 2000 });
    }
  }

  createAnother() {
    this.createdJob.set(null);
    this.form.reset();
  }

  goToJobs() {
    this.router.navigate(['/dashboard/jobs']);
  }
}
