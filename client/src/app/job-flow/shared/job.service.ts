import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Job, ProviderConfig } from './job.model';

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/jobs`;

  createJob(data: {
    customerPhone: string;
    customerName?: string;
    serviceDescription: string;
    totalAmount: number;
    depositAmount: number;
    scheduledDate?: string;
    timeSlotStart?: string;
    timeSlotEnd?: string;
  }): Observable<{ jobId: string; jobUrl: string; message: string }> {
    return this.http.post<{ jobId: string; jobUrl: string; message: string }>(
      this.base,
      data
    );
  }

  listJobs(): Observable<{ jobs: Job[] }> {
    return this.http.get<{ jobs: Job[] }>(this.base);
  }

  getJob(jobId: string): Observable<{ job: Job; provider: ProviderConfig }> {
    return this.http.get<{ job: Job; provider: ProviderConfig }>(
      `${this.base}/${jobId}`
    );
  }

  signContract(
    jobId: string,
    signatureData: string
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/${jobId}/sign`, {
      signatureData,
    });
  }

  createCheckout(jobId: string): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(
      `${this.base}/${jobId}/checkout`,
      {}
    );
  }

  markComplete(jobId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.base}/${jobId}/complete`,
      {}
    );
  }

  recordConsent(jobId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/${jobId}/consent`,
      {}
    );
  }

  confirmCompletion(jobId: string): Observable<{
    message: string;
    zelleInfo: string;
    remainingBalance: string;
  }> {
    return this.http.post<{
      message: string;
      zelleInfo: string;
      remainingBalance: string;
    }>(`${this.base}/${jobId}/confirm`, {});
  }
}
