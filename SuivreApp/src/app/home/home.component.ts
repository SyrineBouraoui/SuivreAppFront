import { Component, OnInit } from '@angular/core';
import { faHeartbeat, faLock, faChartLine, faInfoCircle, faStethoscope, faFile } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: false,
  
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{

  faHeartbeat = faHeartbeat;
  faLock = faLock;
  faChartLine = faChartLine;
  faInfoCircle = faInfoCircle;
  faStethoscope = faStethoscope;
  faFile = faFile;
  newFeedback: string = '';
  feedbacks: string[] = [];
  contactName: string = '';
  contactEmail: string = '';
  contactMessage: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {}

  sendContactMessage(): void {
    if (!this.contactName || !this.contactEmail || !this.contactMessage) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const contactData = {
      name: this.contactName,
      email: this.contactEmail,
      message: this.contactMessage
    };

    // Send the contact message to the backend
    this.http.post('http://192.168.1.11:8080/api/email/contact/send-email', contactData, { responseType: 'text' }).subscribe({
      next: (response: string) => {
        this.isLoading = false;
        this.successMessage = 'Le message est envoyé avec succé!';
        this.contactName = '';
        this.contactEmail = '';
        this.contactMessage = '';
        console.log('Email sent successfully:', response);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to send message. Please try again later.';
        console.error('Error sending email:', err);
      }
    });
  }
  openChatbot(): void {
    this.router.navigate(['/chatbot']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}