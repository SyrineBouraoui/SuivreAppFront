import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private patientsUrl = 'http://localhost:8080/api/patients';
  private apiUrl = 'http://localhost:8080/api/users';
  private authUrl = 'http://localhost:8080/api/auth';
  private doctorsUrl = 'http://localhost:8080/api/doctors';

  constructor(private http: HttpClient) {}

  getAllPatients(): Observable<any[]> {
    return this.http.get<any[]>(this.patientsUrl).pipe(
      map(patients => patients.map(patient => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        userId: patient.userId,
        doctorId: patient.doctorId
      }))),
      catchError(err => {
        console.error('Error fetching patients:', err);
        return of([]);
      })
    );
  }

  getAllDoctors(): Observable<any[]> {
    return this.http.get<any[]>(this.doctorsUrl).pipe(
      map(doctors => doctors.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        doctorId: doctor.id
      }))),
      catchError(err => {
        console.error('Error fetching doctors:', err);
        return of([]);
      })
    );
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(data => {
        let users = data.users || (Array.isArray(data) ? data : []);
        return users.map((user: { id: any; username: any; name: any; email: any; role: any; doctorId: any; }) => ({
          id: user.id,
          username: user.username || user.name,
          email: user.email,
          role: user.role,
          doctorId: user.doctorId
        }));
      }),
      catchError(err => {
        console.error('Error fetching users:', err);
        return of([]);
      })
    );
  }

  addUser(user: any): Observable<any> {
    const signupRequest = {
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      id: user.role === 'PATIENT' && user.doctorId != null ? String(user.doctorId) : null
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.authUrl}/signup`, signupRequest, { headers, responseType: 'text' as 'json' }).pipe(
      map(response => {
        console.log('Signup response:', response);
        return response;
      }),
      catchError(err => {
        console.error('Signup error:', err);
        console.log('Signup error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message
        });
        return throwError(() => err);
      })
    );
  }
  deleteUser(id: number): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(err => {
        console.error('Error deleting user:', err);
        return throwError(() => err);
      })
    );
  }

  updateUser(id: number, user: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const userPayload = {
      id: id,
      username: user.username,
      email: user.email,
      password: user.password || '',
      role: user.role || '',
      doctorId: user.role === 'PATIENT' ? user.doctorId : null
    };

    const patientPayload = {
      id: user.id,
      name: user.username,
      email: user.email,
      userId: id,
      doctorId: user.role === 'PATIENT' ? user.doctorId : null
    };

    const doctorPayload = {
      id: user.doctorId, // Use doctorId directly
      name: user.username || 'Unknown',
      email: user.email
    };

    // Always update the users table first
    const userUrl = `${this.apiUrl}/${id}`;
    const updateUser$ = this.http.put<any>(userUrl, userPayload, { headers }).pipe(
      map(response => {
        console.log('User update response:', response);
        return response;
      }),
      catchError(err => {
        console.error('Error updating user:', err);
        return throwError(() => err);
      })
    );

    // Role-specific updates
    if (user.role === 'PATIENT') {
      return this.getAllPatients().pipe(
        switchMap(patients => {
          const patient = patients.find(p => p.userId === id);
          if (!patient || !patient.id) {
            console.error('Patient not found for userId:', id);
            return throwError(() => new Error('Patient not found for user ID: ' + id));
          }
          const patientUrl = `${this.patientsUrl}/${patient.id}`;
          console.log('Updating patient:', { url: patientUrl, payload: patientPayload });
          return updateUser$.pipe(
            switchMap(() =>
              this.http.put<any>(patientUrl, patientPayload, { headers }).pipe(
                map(response => {
                  console.log('Patient update response:', response);
                  return response;
                }),
                catchError(err => {
                  console.error('Error updating patient:', err);
                  return throwError(() => err);
                })
              )
            )
          );
        })
      );
    } else if (user.role === 'DOCTOR') {
      return this.getAllDoctors().pipe(
        switchMap(doctors => {
          // Find doctor by doctorId instead of email
          const doctor = doctors.find(d => d.id === user.doctorId);
          if (!doctor || !doctor.id) {
            console.error('Doctor not found for doctorId:', user.doctorId);
            return throwError(() => new Error('Doctor not found for doctorId: ' + user.doctorId));
          }
          const doctorUrl = `${this.doctorsUrl}/${doctor.id}`;
          console.log('Updating doctor:', { url: doctorUrl, payload: doctorPayload });
          return updateUser$.pipe(
            switchMap(() =>
              this.http.put<any>(doctorUrl, doctorPayload, { headers }).pipe(
                map(response => {
                  console.log('Doctor update response:', response);
                  return response;
                }),
                catchError(err => {
                  console.error('Error updating doctor:', err);
                  return throwError(() => err);
                })
              )
            )
          );
        })
      );
    } else {
      // Only update users table for other roles
      return updateUser$;
    }
  }
}