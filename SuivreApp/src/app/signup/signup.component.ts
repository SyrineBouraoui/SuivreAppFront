import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [FormsModule],
})
export class SignupComponent {
  fullName: string = '';
  email: string = '';
  password: string = '';
  role: string = 'patient'; // Default value
  doctorId: string = ''; // For storing Doctor ID

  constructor(private authService: AuthService, private router: Router) {}

  registerUser() {
    // Define the user data object
    let userData: any = {
      username: this.fullName,  // Full name as username for the backend
      email: this.email,
      password: this.password,
      role: this.role.toLowerCase(),
      name: this.fullName,  // You can change this depending on what the backend expects
      id: this.doctorId,  // Hardcoded for now or set dynamically as required
    };

    // Add doctorId if the role is doctor
    if (this.role === 'patient' && this.doctorId) {
      userData.doctorId = this.doctorId;  // Add Doctor ID if role is doctor
    }

    console.log('Request Payload:', userData); // Log the request payload

    this.authService.signup(userData).subscribe({
      next: (response) => {
        console.log('Signup successful:', response);
        alert('Inscription réussie !');

        // Redirect after signup
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Signup failed:', err);
        if (err.status === 200) {
          alert('Inscription réussie !');  // Show success message in case of backend status code issue
        } else {
          alert('Erreur lors de l’inscription. Please check the network response.');
        }
      }
      }
    )
    
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onRoleChange() {
    console.log('Selected role:', this.role);
  }
}
