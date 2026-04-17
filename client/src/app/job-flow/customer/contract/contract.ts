import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
  afterNextRender,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobService } from '../../shared/job.service';
import { Job, ProviderConfig } from '../../shared/job.model';

@Component({
  selector: 'app-contract',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './contract.html',
})
export class ContractComponent {
  @ViewChild('sigCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  jobId = this.route.snapshot.paramMap.get('id')!;
  job = signal<Job | null>(null);
  provider = signal<ProviderConfig | null>(null);
  loading = signal(true);
  submitting = signal(false);
  hasSigned = signal(false);
  agreed = false;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  constructor() {
    this.jobService.getJob(this.jobId).subscribe({
      next: ({ job, provider }) => {
        this.job.set(job);
        this.provider.set(provider);
        this.loading.set(false);
        if (job.status !== 'link_sent') {
          this.router.navigate(['/job', this.jobId]);
        }
      },
      error: () => this.router.navigate(['/job', this.jobId]),
    });

    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        // Small delay to ensure canvas is in DOM after *if block resolves
        setTimeout(() => this.initCanvas(), 50);
      }
    });
  }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Mouse
    canvas.addEventListener('mousedown', (e) => {
      this.drawing = true;
      this.lastX = e.offsetX;
      this.lastY = e.offsetY;
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!this.drawing) return;
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(e.offsetX, e.offsetY);
      this.ctx.stroke();
      this.lastX = e.offsetX;
      this.lastY = e.offsetY;
      this.hasSigned.set(true);
    });
    canvas.addEventListener('mouseup', () => (this.drawing = false));
    canvas.addEventListener('mouseleave', () => (this.drawing = false));

    // Touch
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      this.drawing = true;
      this.lastX = e.touches[0].clientX - r.left;
      this.lastY = e.touches[0].clientY - r.top;
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.drawing) return;
      const r = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - r.left;
      const y = e.touches[0].clientY - r.top;
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.lastX = x;
      this.lastY = y;
      this.hasSigned.set(true);
    });
    canvas.addEventListener('touchend', () => (this.drawing = false));
  }

  clearSignature() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSigned.set(false);
  }

  submit() {
    if (!this.hasSigned() || !this.agreed) {
      this.snackBar.open('Please sign and tick the agreement checkbox.', 'OK', { duration: 3000 });
      return;
    }
    const signatureData = this.canvasRef.nativeElement.toDataURL('image/png');
    this.submitting.set(true);
    this.jobService.signContract(this.jobId, signatureData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/job', this.jobId, 'checkout']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err.error?.error || 'Failed to submit. Please try again.', 'Close', { duration: 4000 });
      },
    });
  }

  back() {
    this.router.navigate(['/job', this.jobId]);
  }
}
