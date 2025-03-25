import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  private apiUrl = 'http://localhost:8080/api/doctors'; // Base URL for your API

  constructor(private http: HttpClient) {}

  // Method to get patients by doctor ID
  getPatientsByDoctor(usersId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${usersId}`, {
      headers: this.getAuthHeaders(), // Authorization headers
      withCredentials: true  // Ensure credentials (cookies or tokens) are sent with the request
    });
  }

  // Method to get authentication headers with the token (assuming you're using JWT)
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('jwtToken'); // Retrieve token from storage or other methods
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }
}



