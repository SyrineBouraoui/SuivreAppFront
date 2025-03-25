import { Component, OnInit } from '@angular/core';

import { DoctorService } from './../services/doctor.service';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { ActivatedRoute, Router } from '@angular/router';
import { __param } from 'tslib';
import { ImpersonationService } from '../services/impersonation.service';
import { HttpHeaders } from '@angular/common/http';
import { MessageService } from '../services/message.service';
import { FormControl } from '@angular/forms';

interface Patient {
  id: string;
  name: string;
  selected?: boolean;  // ✅ Added selected property for checkboxes

}

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-doctor',
  standalone: false,
  templateUrl: './doctor.component.html',
  styleUrls: ['./doctor.component.css']
})



export class DoctorComponent implements OnInit {
  user: any = null;
  doctorId: string = '';
  loading: boolean = true;
  errorMessage: string = '';
  patients: any[] = [];
  token: string = '';
  Id: string = '';
  patientId: string = '';
  selectedPatients: string[] = []; // Store selected patient IDs
  doctorMessage = new FormControl('');

  messageHistory: any[] = [];  // Array to hold messages
  patientName: any;
  

  constructor(
    private authService: AuthService, 
    private patientService: PatientService,
    private impersonationService: ImpersonationService,  // Inject the Impersonation Service
    private router: Router,
    private messageService: MessageService,

  ) {}

  ngOnInit() {
    // Fetch user details
    this.getConnectedUserDetails();

    this.doctorId = sessionStorage.getItem('doctorId') || ''; // Fetch the doctorId
    console.log('doctorId from sessionStorage:', this.doctorId); // Ensure doctorId is present here
  
    this.token = sessionStorage.getItem('token') || '';  // Fetch the token
    if (this.token && this.doctorId) {
      this.fetchPatients();
    }
    this.loadMessages();
}

loadMessages() {
    // Get the messages between the doctor and their patients
    this.messageService.getMessagesForDoctor(this.doctorId).subscribe((messages) => {
      this.messageHistory = messages;
    });
}

sendMessageToSelectedPatients() {
    if (!this.doctorId) {
      console.error("🚨 Doctor ID is missing! Fetching from sessionStorage...");
      this.doctorId = sessionStorage.getItem('doctorId') || '';
    }
  
    if (!this.doctorId) {
      alert("Error: Doctor ID is missing. Please refresh the page or log in again.");
      return;
    }
  
    console.log("✅ Using doctorId:", this.doctorId); // Debugging
    const messageContent = this.doctorMessage.value?.trim();
    if (!messageContent) return;
  
    const selectedPatients = this.patients.filter(p => p.selected);
    if (selectedPatients.length === 0) {
      alert('Please select at least one patient.');
      return;
    }
  
    selectedPatients.forEach(patient => {
      const message = {
        doctorId: this.doctorId, // 🔥 Ensure this is set
        patientId: patient.id,
        sender: 'doctor',
        content: messageContent,
        patientName: this.patientName
      };
  
      console.log("📨 Sending message:", message); // Debugging
  
      this.messageService.sendMessage(message).subscribe(
        (msg) => {
          console.log("✅ Message sent successfully:", msg);
          this.messageHistory.push(msg);
        },
        (error) => {
          console.error("❌ Failed to send message:", error);
        }
      );
    });
  
    this.doctorMessage.reset();
}

// Fetch patients for the logged-in doctor
fetchPatients() {
    if (!this.token) {
      console.error('No token found. Please log in.');
      return;
    }

    if (this.doctorId) {
      this.patientService.getPatientsByDoctor(this.doctorId, this.token).subscribe(
        (data) => {
          this.patients = data;
          console.log('Patients fetched:', this.patients);
        // Populate patientNames dictionary
        this.patients.forEach(patient => {
          this.patientName[patient.id] = patient.name;
        });
      },
        (error) => {
          console.error('Error fetching patients:', error);
        }
      );
    }
}

getPatientName(patientId: string): string {
    return this.patientName[patientId] || 'Unknown Patient';
}

// Fetch connected user details
getConnectedUserDetails() {
    this.authService.getConnectedUserDetails().subscribe(response => {
      console.log('API Response:', response);
      
      if (response && response.user) {
        this.user = response.user;
        this.doctorId = this.user.doctorId; // Make sure this is populated
        
      } else {
        this.errorMessage = 'User not found or invalid response structure.';
      }
    },
    (error) => {
      console.error('Error fetching user:', error);
      this.errorMessage = 'An error occurred while fetching user data.';
    });
}

dropdownOpen = false;

// Ouvrir / fermer le dropdown
toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
}

// Afficher les patients sélectionnés (pour debug)
logSelectedPatients() {
  console.log("Patients sélectionnés :", this.patients.filter(p => p.selected));
}

impersonatePatient(patientId: string, patientName:string) {
    if (!this.token) {
      console.error('Missing token');
      return;
    }
  
    // Ensure doctorId is fetched from sessionStorage
    const doctorId = sessionStorage.getItem('doctorId'); // Fetch doctorId from sessionStorage or wherever it is stored
    if (!doctorId) {
      console.error('Missing doctorId');
      return;
    }
  
    // Set the Authorization header and doctorId header
    let headers = this.authService.getAuthHeaders();
    headers = headers.set('doctorId', doctorId); // Add doctorId to the headers
  
    console.log('Headers sent to backend: ', headers); // Log headers for debugging
  
    // Call the impersonation service to impersonate the patient
    this.impersonationService.impersonatePatient(patientId, headers).subscribe({
      next: (response) => {
        console.log('Response from backend: ', response); // Log response to see if patientName and token are returned
        // Store the impersonated patient's token in sessionStorage
        sessionStorage.setItem('patientToken', response.token);
  
        // Get the patient's name from the response
        alert(`You are now impersonating patient: ${response.patientName}`);
  
        // Redirect to the patient's dashboard or any desired page
        sessionStorage.setItem('patientName', response.patientName);

        this.router.navigate(['/patient', patientId]);
        state: { patientName: patientName } // Pass the patient's name
      },
      error: (err) => {
        console.error('Error impersonating patient', err);
        alert('Unable to impersonate patient');
      }
    });
}

// Logout
logout() {
    this.authService.logout();
}
}