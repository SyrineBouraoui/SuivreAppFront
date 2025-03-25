import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule],
})


export class LoginComponent {

email: string = '';
password: string = '';
errorMessage: string = '';
loading: boolean = false; // Track loading state

constructor(private authService: AuthService, private router: Router) {}

// This method is triggered when the user logs in
// In your login method
loginUser() {
  this.loading = true;
  this.errorMessage = '';
  console.log('Login Data:', this.email, this.password);

  this.authService.login(this.email, this.password).subscribe(
    (response) => {
      console.log('Login Response:', response);

      // Ensure that the response has the required fields
      if (response.token && response.id && response.role) {
        // Directly access doctorId from the response (not from response.user)
        const doctorId = response.doctorId ?? null;// Correctly access doctorId here
        const patientId = response.patientId ?? null; // Handle patientId here


        if (doctorId === undefined) {
          console.error('Doctor ID is missing from the response');
          return;
        }

        if (response.role === 'PATIENT' && patientId === null) {
          console.error('Patient ID is missing from the response');
          return;
        }
        console.log('Doctor ID from response:', doctorId);
        console.log('Patient ID from response:', patientId);


        // Save the token and doctorId correctly
        this.authService.saveToken(response.token, response.role, response.id, doctorId, patientId);

        this.saveUserData(response);
        this.redirectUser(response);
      } else {
        console.error('Login response missing token, role, or id:', response);
      }
    },
    (error) => {
      console.error('Login failed:', error);
      this.loading = false;
      this.errorMessage = 'Login failed. Please check your credentials and try again.';
    }
  );
}



private saveUserData(response: any): void {
  // Save the token from the response
  localStorage.setItem('token', response.token);  // Save token
  if (response.doctorId) {
    localStorage.setItem('doctorId', response.doctorId); // Ensure this is set during login
  }
  if (response.patientId) {
    localStorage.setItem('patientId', response.patientId); // Save patientId if the user is a patient
  }

  // Save the user info (id, username, email, role)
  localStorage.setItem('user', JSON.stringify({
    id: response.id,          // User ID
    username: response.user.username,  // User's username
    email: response.user.email,        // User's email
    role: response.role,      // User's role (DOCTOR, PATIENT, etc.)
  }));  // Save user info

  console.log('Token and user data saved to localStorage:', response.token, response.user);
}

// Method to redirect the user based on their role
private redirectUser(response: any): void {
  const role = response.role.toUpperCase();

  if (role === 'DOCTOR') {
    console.log('Navigating to /doctor/' + response.doctorId);
    // Redirect to doctor dashboard using doctorId
    this.router.navigate([`/doctor`, response.doctorId]);
  } else if (role === 'PATIENT') {
    console.log('Navigating to /patient/' + response.patientId);
    // Redirect to patient dashboard using patientId
    this.router.navigate([`/patient`, response.patientId]);
  } else {
    this.errorMessage = 'Invalid role detected. Please contact support.';
  }
}

// Optionally, navigate to home or another page
goToHome() {
  this.router.navigate(['/']);
}}