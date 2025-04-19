import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {
  // Variables for forgot-password phase
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  // Variables for reset-password phase
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // To toggle between the phases
  isResettingPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if we have a token in the URL (reset password phase)
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.token = params['token'];  // Get token from URL
        this.isResettingPassword = true;  // Switch to the reset password phase
      }
    });
  }

  // Phase 1: Request reset password email
  sendResetPasswordEmail() {
    if (!this.email) {
      this.errorMessage = "Veuillez entrer votre adresse e-mail.";
      return;
    }

    this.authService.sendResetPasswordEmail(this.email).subscribe(
      (response: string) => {
        this.successMessage = response;  // Response message from backend
        this.errorMessage = '';
      },
      (error) => {
        console.error('Error sending password reset email:', error);
        this.errorMessage = "Il y a eu un problème lors de l'envoi de l'email de réinitialisation.";
        this.successMessage = '';
      }
    );
  }

  // Phase 2: Reset password with token
  resetPassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Le lien de réinitialisation est invalide.';
      return;
    }

    // Send the new password along with the token to reset the password
    this.authService.resetPassword(this.token, this.newPassword).subscribe(
      (response) => {
        this.successMessage = 'Mot de passe réinitialisé avec succès !';
        this.errorMessage = '';
        // After success, redirect user to the login page
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Error resetting password:', error);
        this.errorMessage = 'Il y a eu un problème avec la réinitialisation du mot de passe.';
        this.successMessage = '';
      }
    );
  }
}