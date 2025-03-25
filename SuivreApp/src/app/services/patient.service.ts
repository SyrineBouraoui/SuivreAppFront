import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';  // Import catchError here
import { throwError } from 'rxjs';  // Import throwError to return errors properly

import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private API_URL = 'http://localhost:8080/api/patients';

  constructor(private http: HttpClient,     private authService: AuthService, 
  ) {}

  getPatientsByDoctor(doctorId: string, token: string): Observable<any[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(`${this.API_URL}/doctor/${doctorId}`, { headers });
  }
  getPatientById(patientId: string): Observable<any> {
    const url = `${this.API_URL}/${patientId}`;
    return this.http.get<any>(url);
  }
  impersonatePatient(patientId: string, headers: HttpHeaders) {
    const url = `${this.API_URL}/${patientId}/impersonate`;
  
    // Now we pass headers into the HTTP request
    return this.http.get<any>(url, { headers });
  
}}