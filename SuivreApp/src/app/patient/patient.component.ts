import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../services/doctor.service';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { Message, MessageService } from '../services/message.service';
import { ActivatedRoute, Router } from '@angular/router';

interface SensorData {
  id: number;
  temperature: number;
  humidity: number;
  timestamp: string;
  patientId: string;
}

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.css']
})
export class PatientComponent implements OnInit {
  heartRate: number = 70;
  oxygen: number = 100;
  healthStatus: string = 'Normal';
  temperature: number = 0;
  airTemperature: number = 0;

  notifications: string[] = [];
  Id: string = '';
  loading: boolean = true;
  errorMessage: string = '';
  user: any;
  patientName: string = '';
  userId: string | null = null;
  doctorPhone: string = '';
  patientId: string | null = null;
  doctorId: string | null = null;
  patientMessage = '';
  messageHistory: Message[] = [];

  @ViewChild('heartRateChart') heartRateChart!: ElementRef;
  @ViewChild('temperatureChart') temperatureChart!: ElementRef;
  @ViewChild('oxygenChart') oxygenChart!: ElementRef;
  @ViewChild('airTempChart') airTempChart!: ElementRef;

  last7Days: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  heartRateData: number[] = [75, 80, 72, 78, 85, 74, 76];
  temperatureData: number[] = [];
  oxygenData: number[] = [98, 97, 99, 96, 95, 98, 97];
  airTempData: number[] = [];
  temperatureLabels: string[] = [];
  airTempLabels: string[] = [];

  // New properties for user feedback
  isLoadingSensorData: boolean = false;
  sensorDataError: string | null = null;

  constructor(
    private messageService: MessageService,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id');
      if (this.userId) {
        this.getConnectedUserDetails(this.userId);
      } else {
        console.error('No user ID found in route.');
        this.errorMessage = 'Unable to load user details. Please try logging in again.';
      }
    });

    this.patientId = localStorage.getItem('patientId') || '';
    this.doctorId = sessionStorage.getItem('doctorId');

    if (!this.patientId || !this.doctorId) {
      console.error('Patient ID or Doctor ID not found!');
      this.errorMessage = 'Authentication error. Please log in again.';
      return;
    }

    this.loadMessages();
    this.updateHealthStatus();
    this.fetchSensorData();
    setInterval(() => this.fetchSensorData(), 60000);
  }

  ngAfterViewInit() {
    this.createChart(this.heartRateChart.nativeElement, 'Heart Rate (BPM)', this.heartRateData, 'purple');
    this.createChart(this.temperatureChart.nativeElement, 'Temperature (°C)', this.temperatureData, 'blue', this.temperatureLabels);
    this.createChart(this.oxygenChart.nativeElement, 'Oxygen (%)', this.oxygenData, 'yellow');
    this.createChart(this.airTempChart.nativeElement, 'Humidity (%)', this.airTempData, 'grey', this.airTempLabels);
  }

  fetchSensorData(): void {
    if (!this.patientId) {
      console.error('No patient ID available to fetch sensor data.');
      this.sensorDataError = 'Cannot fetch sensor data. Please log in again.';
      return;
    }

    this.isLoadingSensorData = true;
    this.sensorDataError = null;

    this.http.get<SensorData[]>(`http://192.168.1.8:8080/api/sensor/data/${this.patientId}`).subscribe({
      next: (data: SensorData[]) => {
        this.isLoadingSensorData = false;
        if (data && data.length > 0) {
          this.temperatureData = [];
          this.airTempData = [];
          this.temperatureLabels = [];
          this.airTempLabels = [];

          const recentData = data.slice(-7);

          recentData.forEach((entry) => {
            this.temperatureData.push(entry.temperature);
            this.airTempData.push(entry.humidity);
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            this.temperatureLabels.push(timestamp);
            this.airTempLabels.push(timestamp);
          });

          const latest = data[data.length - 1];
          this.temperature = latest.temperature;
          this.airTemperature = latest.humidity;

          this.updateChart(this.temperatureChart.nativeElement, 'Temperature (°C)', this.temperatureData, 'blue', this.temperatureLabels);
          this.updateChart(this.airTempChart.nativeElement, 'Humidity (%)', this.airTempData, 'grey', this.airTempLabels);
          this.updateHealthStatus();
        } else {
          this.sensorDataError = 'No sensor data available for this patient.';
        }
      },
      error: (err) => {
        this.isLoadingSensorData = false;
        console.error('Error fetching sensor data:', err);
        this.sensorDataError = 'Failed to load sensor data. Please try again later.';
      }
    });
  }

  createChart(canvas: HTMLCanvasElement, label: string, data: number[], color: string, labels: string[] = this.last7Days) {
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
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

  updateChart(canvas: HTMLCanvasElement, label: string, data: number[], color: string, labels: string[]) {
    const chart = Chart.getChart(canvas);
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].label = label;
      chart.update();
    } else {
      this.createChart(canvas, label, data, color, labels);
    }
  }

  sendMessage() {
    if (!this.patientMessage.trim() || !this.doctorId) return;
    const usernameToSend = sessionStorage.getItem('username') || 'Unknown User';
    console.log('Sending message for user:', usernameToSend);
    const newMessage: Message = {
      patientId: this.patientId,
      doctorId: this.doctorId,
      sender: 'patient',
      content: this.patientMessage,
      patientName: usernameToSend
    };
    this.messageService.sendMessage(newMessage).subscribe(
      (msg) => {
        console.log('Message sent successfully:', msg);
        this.messageHistory.push(msg);
        this.patientMessage = '';
        console.log(`Message sent to doctor with ID: ${this.doctorId}`);
      },
      (error) => {
        console.error('Error sending message:', error);
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

  getPatientDetails(patientId: string): void {
    this.patientService.getPatientById(patientId).subscribe(
      (response) => {
        console.log('Patient Details:', response);
        if (response && response.patientName) {
          this.patientName = response.patientName;
          this.authService.savePatientName(patientId, this.patientName);
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
          this.user = response;
          this.storeUsername(response.user.username);
        } else {
          console.error('User not found.');
        }
      },
      (error) => {
        console.error('Error fetching user:', error);
      }
    );
  }

  storeUsername(username: string) {
    sessionStorage.setItem('username', username);
    console.log('Username stored:', username);
  }

  updateHealthStatus(): void {
    let alerts = 0;
    if (this.heartRate < 60 || this.heartRate > 100) {
      alerts++;
      this.addNotification('Fréquence cardiaque élevée détectée !');
    }
    if (this.temperature < 36 || this.temperature > 38) {
      alerts++;
      this.addNotification('Température corporelle élevée détectée !');
    }
    if (this.oxygen < 90) {
      alerts++;
      this.addNotification('Niveau d\'oxygène bas détecté !');
    }
    if (this.airTemperature < 30 || this.airTemperature > 80) {
      alerts++;
      this.addNotification('Humidité extrême détectée !');
    }
    if (alerts > 0) {
      this.sendAlert();
    } else {
      this.healthStatus = 'Normale';
    }
  }

  addNotification(message: string) {
    if (this.notifications.length >= 5) {
      this.notifications.shift();
    }
    this.notifications.push(message);
  }

  sendAlert() {
    const doctorPhone = '+21697404410';
    const alertData = {
      heartRate: this.heartRate,
      temperature: this.temperature,
      oxygen: this.oxygen,
      airTemperature: this.airTemperature,
      doctorPhone: doctorPhone,
      patientName: this.patientName
    };
    this.http.post('http://localhost:8080/api/alerts/send-sms', alertData, { responseType: 'text' }).subscribe(
      (response: string) => {
        console.log('Alert response:', response);
      },
      (error) => {
        console.error('Error sending alert:', error);
      }
    );
  }

  getHealthColor(): string {
    return this.healthStatus === 'Critique' ? 'red' :
           this.healthStatus === 'Alerte' ? 'orange' : 'green';
  }

  getCardClass(type: string, value: number): string {
    switch (type) {
      case 'heartRate':
        return value < 60 || value > 100 ? 'danger' :
               value < 70 || value > 90 ? 'warning' :
               'healthy';
      case 'temperature':
        return value < 36 || value > 38 ? 'danger' :
               value < 36.5 || value > 37.5 ? 'warning' :
               'healthy';
      case 'oxygen':
        return value < 90 ? 'danger' :
               value < 95 ? 'warning' :
               'healthy';
      case 'airTemperature':
        return value < 30 || value > 80 ? 'danger' :
               value < 40 || value > 70 ? 'warning' :
               'healthy';
      default:
        return 'healthy';
    }
  }

  logout() {
    this.authService.logout();
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}