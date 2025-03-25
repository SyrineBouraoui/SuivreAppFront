import { Component } from '@angular/core';
import { faHeartbeat, faLock, faChartLine, faInfoCircle, faStethoscope, faFile } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: false,
  
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  faHeartbeat = faHeartbeat;
  faLock = faLock;
  faChartLine = faChartLine;
  faInfoCircle = faInfoCircle;
  faStethoscope = faStethoscope;
  faFile = faFile;
  newFeedback: string = '';
  feedbacks: string[] = [];

  addFeedback() {
    if (this.newFeedback.trim()) {
      this.feedbacks.push(this.newFeedback);
      this.newFeedback = '';
    }
  }
  deleteFeedback(index: number) {
    this.feedbacks.splice(index, 1); // Supprime l'élément à l'index donné
  }

  contactForm: FormGroup;
  messageSent: boolean = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required],
    });
  }

  sendMessage() {
    if (this.contactForm.valid) {
      console.log('Message Ready to be Sent:', this.contactForm.value);
      this.messageSent = true;
      this.contactForm.reset();
      
      // Masquer le message après 5 secondes
      setTimeout(() => {
        this.messageSent = false;
      }, 5000);
    }
  }}