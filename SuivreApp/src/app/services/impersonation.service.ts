import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';  // Import catchError here
import { throwError } from 'rxjs';  // Import throwError to return errors properly

import { AuthService } from '../services/auth.service';




@Injectable({
  providedIn: 'root'
})
export class ImpersonationService {


    private apiUrl = 'http://localhost:8080/api/patients';  // Replace with your correct backend API URL
    constructor(private http: HttpClient, private authService: AuthService) {}
    impersonatePatient(patientId: string, headers: HttpHeaders): Observable<any> {
      const url = `${this.apiUrl}/${patientId}/impersonate`;
    
      // Make the GET request with the headers
      return this.http.get<any>(url, { headers }).pipe(
        catchError((error) => {
          console.error('Error in impersonation service:', error);
          return throwError(error);  // Ensure the error is thrown correctly
        })
      );
    }}
    