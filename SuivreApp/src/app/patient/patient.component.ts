import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import { FormsModule } from '@angular/forms';  
import { CommonModule } from '@angular/common';  
import { DoctorService } from './../services/doctor.service';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { __param } from 'tslib';
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { Message, MessageService } from '../services/message.service';



@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [FormsModule, CommonModule], 
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.css']
})
export class PatientComponent   {
  heartRate: number = 70; // Example value
  temperature: number = 6; // Example value
  oxygen: number = 100; // Example value
  airTemperature: number = 30; // Example value
  healthStatus: string = "Normal"; 

  notifications: string[] = []; // Stores notifications
  

  // Holds user details
  Id: string = '';
  loading: boolean = true;
  errorMessage: string = '';
  user: any; // ✅ Make sure this is defined
  patientName: string =''; // Initialize patientName

  userId: string | null = null; // Store userId from route
  doctorPhone: string = '';  // Add doctor's phone number


  patientId: string| null = null;
  doctorId: string| null = null;
  patientMessage = '';
  messageHistory: Message[] = [];




  constructor(    private messageService: MessageService, private http: HttpClient, private authService: AuthService, private route: ActivatedRoute, private router: Router, private patientService: PatientService) { 
    this.updateHealthStatus(); // ✅ Keep your existing function call
    this.ngOnInit();

  }
  

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id'); // Get patient ID from URL
  
      // Check if 'patientName' is available from route first, else from sessionStorage
      if (this.userId) {
        this.getConnectedUserDetails(this.userId);
      } else {
        console.error('No user ID found in route.');
      }
    });
  
    this.updateHealthStatus();
    this.patientId = localStorage.getItem('patientId') || ''; 
    this.doctorId = sessionStorage.getItem('doctorId');
  
    // Ensure IDs are valid
    if (!this.patientId || !this.doctorId) {
      console.error("Patient ID or Doctor ID not found!");
      return;
    }
  
    this.loadMessages();
  }
  
  sendMessage() {
    if (!this.patientMessage.trim() || !this.doctorId) return;
  
    // Retrieve username from sessionStorage
    const usernameToSend = sessionStorage.getItem('username') || 'Unknown User';
  
    console.log('Sending message for user:', usernameToSend); // Log the actual name being sent
  
    const newMessage: Message = {
        patientId: this.patientId,
        doctorId: this.doctorId,
        sender: 'patient',
        content: this.patientMessage,
        patientName: usernameToSend,  // ✅ Now using username instead of patientName
    };
  
    this.messageService.sendMessage(newMessage).subscribe(
        (msg) => {
            console.log("Message sent successfully:", msg);
            this.messageHistory.push(msg); // Add new message to message history
            this.patientMessage = ''; // Clear the message input field
            console.log(`Message sent to doctor with ID: ${this.doctorId}`);
        },
        (error) => {
            console.error("Error sending message:", error);
            // Optional: Show an error notification to the user
        }
    );
  }
  
  loadMessages() {
    if (this.patientId && this.doctorId) {
      this.messageService.getMessages(this.patientId, this.doctorId).subscribe((messages) => {
        this.messageHistory = messages;
      });
    }
  }
  
  // Get patient details and save patientName in AuthService
  getPatientDetails(patientId: string): void {
    this.patientService.getPatientById(patientId).subscribe(
      (response) => {
        console.log('Patient Details:', response);
        if (response && response.patientName) {
          this.patientName = response.patientName;
          this.authService.savePatientName(patientId, this.patientName); // Save patientName in AuthService
        }
      },
      (error) => {
        console.error('Error fetching patient:', error);
      }
    );
  }
  
  getConnectedUserDetails(userId: string) {
    this.authService.getConnectedUserDetails().subscribe(
      (response) => {
        console.log('API Response:', response);
        if (response) {
          this.user = response; // ✅ Store user data
          this.storeUsername(response.user.username); // ✅ Pass username to another method
  
        } else {
          console.error('User not found.');
        }
      },
      (error) => {
        console.error('Error fetching user:', error);
      }
    );
  }
  
  // Method to store username
  storeUsername(username: string) {
    sessionStorage.setItem('username', username);
    console.log('Username stored:', username);
  }
  
  updateHealthStatus(): void {
    let alerts = 0;
  
    if (this.heartRate < 60 || this.heartRate > 100) {
      alerts++;
      this.addNotification(" High Heart Rate detected!");
    }
    if (this.temperature < 36 || this.temperature > 38) {
      alerts++;
      this.addNotification(" High Body Temperature detected!");
    }
    if (this.oxygen < 90) {
      alerts++;
      this.addNotification(" Low Oxygen Level detected!");
    }
    if (this.airTemperature < 15 || this.airTemperature > 30) {
      alerts++;
      this.addNotification(" Extreme Air Temperature detected.");
    }
  
    if (alerts > 0) {
      this.sendAlert();
    } else {
      this.healthStatus = "Normal";
    }
  }
  
  addNotification(message: string) {
    if (this.notifications.length >= 5) {
      this.notifications.shift(); // Remove the oldest message if the array exceeds 5
    }
    this.notifications.push(message);
  }
  
  sendAlert() {
    // Prepare the data to send to the backend
    const doctorPhone = '+21697404410';  // Example doctor phone number
  
    const alertData = {
      heartRate: this.heartRate,
      temperature: this.temperature,
      oxygen: this.oxygen,
      airTemperature: this.airTemperature,
      doctorPhone: doctorPhone,
      patientName: this.patientName  // Replace with the actual patient's name
    };
  
    // Send the health data to the backend to trigger SMS alert
    this.http.post('http://localhost:8080/api/alerts/send-sms', alertData, { responseType: 'text' }).subscribe(
      (response: string) => {
        // Since we expect a plain text response, the response will be a string
        console.log('Alert response:', response);  // Logs the plain text response from backend
      },
      (error) => {
        console.error('Error sending alert:', error);
      }
    );
  }
  
  getHealthColor(): string {
    return this.healthStatus === "Critique" ? "red" :
           this.healthStatus === "Alerte" ? "orange" : "green";
  }
  
  getCardClass(type: string, value: number): string {
    switch (type) {
      case "heartRate":
        return value < 60 || value > 100 ? 'danger' :
               value < 70 || value > 90 ? 'warning' :
               'healthy';
      case "temperature":
        return value < 36 || value > 38 ? 'danger' :
               value < 36.5 || value > 37.5 ? 'warning' :
               'healthy';
      case "oxygen":
        return value < 90 ? 'danger' :
               value < 95 ? 'warning' :
               'healthy';
      case "airTemperature":
        return value < 15 || value > 30 ? 'danger' :
               value < 18 || value > 27 ? 'warning' :
               'healthy';
      default:
        return 'healthy';
    }
  }
  
  @ViewChild('heartRateChart') heartRateChart!: ElementRef;
  @ViewChild('temperatureChart') temperatureChart!: ElementRef;
  @ViewChild('oxygenChart') oxygenChart!: ElementRef;
  @ViewChild('airTempChart') airTempChart!: ElementRef;
  
  last7Days: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  heartRateData: number[] = [75, 80, 72, 78, 85, 74, 76];
  temperatureData: number[] = [36.5, 36.7, 36.4, 36.6, 37, 36.8, 36.5];
  oxygenData: number[] = [98, 97, 99, 96, 95, 98, 97];
  airTempData: number[] = [25, 26, 24, 23, 22, 27, 26];
  
  ngAfterViewInit() {
    this.createChart(this.heartRateChart.nativeElement, 'Heart Rate (BPM)', this.heartRateData, 'purple');
    this.createChart(this.temperatureChart.nativeElement, 'Temperature (°C)', this.temperatureData, 'blue');
    this.createChart(this.oxygenChart.nativeElement, 'Oxygen (%)', this.oxygenData, 'yellow');
    this.createChart(this.airTempChart.nativeElement, 'Air Temp (°C)', this.airTempData, 'grey');
  }
  
  createChart(canvas: HTMLCanvasElement, label: string, data: number[], color: string) {
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.last7Days,
        datasets: [{
          label: label,
          data: data,
          borderColor: color,
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { x: { display: true }, y: { display: true } }
      }
    });
  }
  
  logout() {
    this.authService.logout();
  }
  
  // Optionally, navigate to home or another page
  goToHome() {
    this.router.navigate(['/']);
  }
}  