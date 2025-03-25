import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

// User interface remains the same
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  doctorId?: number;  // doctorId is optional
}
export interface AuthResponse {
  patientId?: number; 
  token: string;
  role: string;
  id: number;
  doctorId?: number;  // doctorId is directly on the AuthResponse
  user: User;  // user is an object containing user details (without doctorId)
}



@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // Your backend URL
  private doctorApiUrl = 'http://localhost:8080/api/doctors';
  private userApiUrl = 'http://localhost:8080/api/users'; // API for patients

  constructor(private http: HttpClient, private router: Router) {}

  // 🔹 Signup: Register a new user
  signup(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, userData);
  }

  // 🔹 Login: Authenticate and get JWT token + user ID + role
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password });
  }
  savePatientName(patientId: string, patientName: string): void {
    sessionStorage.setItem('patientId', patientId);  // Use sessionStorage instead of localStorage
    sessionStorage.setItem('patientName', patientName);  // Use sessionStorage instead of localStorage
}

// Retrieve patientName from sessionStorage
getPatientName(): string {
    return sessionStorage.getItem('patientName') || 'Unknown Patient';  // Use sessionStorage instead of localStorage
}

getConnectedUserDetails(): Observable<any> {
    const role = sessionStorage.getItem('role');  // Use sessionStorage instead of localStorage
    const userId = sessionStorage.getItem('userId');  // Use sessionStorage instead of localStorage
    const doctorId = sessionStorage.getItem('doctorId');  // Use sessionStorage instead of localStorage

    if (!role || !userId) {
        throw new Error('User role or ID not found');
    }

    let url: string;

    if (role.toUpperCase() === 'DOCTOR') {
        if (!doctorId) {
            throw new Error('Doctor ID not found for a doctor user');
        }
        url = `${this.doctorApiUrl}/getDoctor/${doctorId}`;
    } else if (role.toUpperCase() === 'PATIENT') {
        url = `${this.userApiUrl}/getUser/${userId}`;
    } else {
        throw new Error('Invalid user role');
    }

    return this.http.get<any>(url, {
        headers: this.getAuthHeaders(),
    });
}

isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');  // Use sessionStorage instead of localStorage
}

saveToken(token: string, role: string, id: number, doctorId?: number | null | undefined, patientId?: number | null | undefined): void {
    sessionStorage.clear();  // Clear the sessionStorage first
    console.log("Saving token and doctorId to sessionStorage:", token, role, id, doctorId, patientId);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('role', role);
    sessionStorage.setItem('userId', id.toString());

    if (doctorId !== null && doctorId !== undefined) {
        sessionStorage.setItem('doctorId', doctorId.toString());  // Save doctorId if provided
    } else {
        sessionStorage.removeItem('doctorId'); // Ensure old values are cleared if not needed
    }
    console.log("Saving token and doctorId to sessionStorage222222222222:", token, role, id, doctorId, patientId);
}

// Get the token from sessionStorage
getToken() {
    return sessionStorage.getItem('token');
}

// 🔹 Get user details from sessionStorage
getUser() {
    const user = JSON.parse(sessionStorage.getItem('user')!);  // Use sessionStorage instead of localStorage
    return user;
}

getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });
}

// 🔹 Logout and clear sessionStorage
logout() {
    sessionStorage.clear();  // Use sessionStorage.clear() instead of localStorage.clear()
    this.router.navigate(['/login']);  // Redirect to login page
}
}