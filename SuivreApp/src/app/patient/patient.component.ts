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
interface HeartRateData {
  id: number;
  heartRate: number;
  spo2: number;
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

  heartRateData: number[] = [];
  temperatureData: number[] = [];
  oxygenData: number[] = [];
  airTempData: number[] = [];
  temperatureLabels: string[] = [];
  airTempLabels: string[] = [];
  heartRateLabels: string[] = [];
  oxygenLabels: string[] = [];

  isLoadingSensorData: boolean = false;
  sensorDataError: string | null = null;
  isLoadingHeartRateData: boolean = false;
  heartRateDataError: string | null = null;

  constructor(
    private messageService: MessageService,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit() {
  // Extract patientId from route
  this.patientId = this.route.snapshot.paramMap.get('id');
  console.log('Patient ID (from route):', this.patientId);

  if (this.patientId) {
    this.fetchPatientData(this.patientId);
  } else {
    console.error('No patientId found in route');
    // Fallback to localStorage only if route param is missing
    this.patientId = localStorage.getItem('patientId') || '';
    if (!this.patientId) {
      this.errorMessage = 'No patient ID found. Please log in again.';
      return;
    }
  }

  // Keep doctorId from sessionStorage
  this.doctorId = sessionStorage.getItem('doctorId');
  if (!this.doctorId) {
    console.error('Doctor ID not found!');
    this.errorMessage = 'Authentication error. Please log in again.';
    return;
  }

  // Update localStorage to match route patientId
  if (this.patientId) {
    localStorage.setItem('patientId', this.patientId);
  }

  console.log('Patient ID (final):', this.patientId);

  this.route.paramMap.subscribe(params => {
    this.userId = params.get('id');
    if (this.userId) {
      this.getConnectedUserDetails(this.userId);
    } else {
      console.error('No user ID found in route.');
      this.errorMessage = 'Unable to load user details. Please try logging in again.';
    }
  });

  this.loadMessages();
  this.updateHealthStatus();
  this.fetchSensorData();
  this.fetchHeartRateData();
  setInterval(() => {
    this.fetchSensorData();
    this.fetchHeartRateData();
  }, 60000);
}
fetchPatientData(patientId: string) {
    // Replace with your actual data fetching logic
    console.log('Fetching heart rate data for patientId:', patientId);
    // Example: Call a service to fetch data
    // this.patientService.getHealthData(patientId).subscribe(...);
  }




  // Add these properties to your PatientComponent class
showHistoricalDashboard: boolean = false; // Toggle for historical dashboard visibility
historicalHeartRateData: { [key: string]: number[] } = {};
historicalTemperatureData: { [key: string]: number[] } = {};
historicalOxygenData: { [key: string]: number[] } = {};
historicalAirTempData: { [key: string]: number[] } = {};
historicalLabels: string[] = []; // To store the dates as labels

// Add a method to toggle the historical dashboard
toggleHistoricalDashboard(): void {
  this.showHistoricalDashboard = !this.showHistoricalDashboard;
  if (this.showHistoricalDashboard) {
    this.fetchHistoricalData();
  }
}

// Add a method to fetch historical data (last 7 days, for example)
fetchHistoricalData(): void {
  if (!this.patientId) {
    console.error('No patient ID available to fetch historical data.');
    return;
  }

  // Fetch sensor data (temperature, humidity)
  this.http.get<SensorData[]>(`http://localhost:8080/api/sensor/data/${this.patientId}`).subscribe({
    next: (data: SensorData[]) => {
      this.processHistoricalSensorData(data);
    },
    error: (err) => {
      console.error('Error fetching historical sensor data:', err);
    }
  });

  // Fetch heart rate data (heart rate, spo2)
  this.http.get<HeartRateData[]>(`http://localhost:8080/api/heartrate/data/${this.patientId}`).subscribe({
    next: (data: HeartRateData[]) => {
      this.processHistoricalHeartRateData(data);
    },
    error: (err) => {
      console.error('Error fetching historical heart rate data:', err);
    }
  });
}

// Process sensor data (temperature, humidity) by day
processHistoricalSensorData(data: SensorData[]): void {
  const groupedByDay: { [key: string]: { temperature: number[], humidity: number[] } } = {};

  data.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString(); // Group by day
    if (!groupedByDay[date]) {
      groupedByDay[date] = { temperature: [], humidity: [] };
    }
    groupedByDay[date].temperature.push(entry.temperature);
    groupedByDay[date].humidity.push(entry.humidity);
  });

  this.historicalLabels = Object.keys(groupedByDay).slice(-7); // Last 7 days
  this.historicalTemperatureData = {};
  this.historicalAirTempData = {};

  this.historicalLabels.forEach(date => {
    const avgTemperature = groupedByDay[date].temperature.reduce((a, b) => a + b, 0) / groupedByDay[date].temperature.length;
    const avgHumidity = groupedByDay[date].humidity.reduce((a, b) => a + b, 0) / groupedByDay[date].humidity.length;
    this.historicalTemperatureData[date] = [avgTemperature];
    this.historicalAirTempData[date] = [avgHumidity];
  });

  this.updateHistoricalCharts();
}

// Process heart rate data (heart rate, spo2) by day
processHistoricalHeartRateData(data: HeartRateData[]): void {
  const groupedByDay: { [key: string]: { heartRate: number[], spo2: number[] } } = {};

  data.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString(); // Group by day
    if (!groupedByDay[date]) {
      groupedByDay[date] = { heartRate: [], spo2: [] };
    }
    groupedByDay[date].heartRate.push(entry.heartRate);
    groupedByDay[date].spo2.push(entry.spo2);
  });

  this.historicalLabels = Object.keys(groupedByDay).slice(-7); // Last 7 days
  this.historicalHeartRateData = {};
  this.historicalOxygenData = {};

  this.historicalLabels.forEach(date => {
    const avgHeartRate = groupedByDay[date].heartRate.reduce((a, b) => a + b, 0) / groupedByDay[date].heartRate.length;
    const avgSpo2 = groupedByDay[date].spo2.reduce((a, b) => a + b, 0) / groupedByDay[date].spo2.length;
    this.historicalHeartRateData[date] = [avgHeartRate];
    this.historicalOxygenData[date] = [avgSpo2];
  });

  this.updateHistoricalCharts();
}

// Update or create historical charts
updateHistoricalCharts(): void {
  if (this.showHistoricalDashboard) {
    const historicalHeartRateCanvas = document.getElementById('historicalHeartRateChart') as HTMLCanvasElement;
    const historicalTemperatureCanvas = document.getElementById('historicalTemperatureChart') as HTMLCanvasElement;
    const historicalOxygenCanvas = document.getElementById('historicalOxygenChart') as HTMLCanvasElement;
    const historicalAirTempCanvas = document.getElementById('historicalAirTempChart') as HTMLCanvasElement;

    this.updateChart(historicalHeartRateCanvas, 'Historical Heart Rate (BPM)', this.historicalLabels.map(date => this.historicalHeartRateData[date][0]), 'purple', this.historicalLabels, 70, 150);
    this.updateChart(historicalTemperatureCanvas, 'Historical Temperature (°C)', this.historicalLabels.map(date => this.historicalTemperatureData[date][0]), 'blue', this.historicalLabels, 15, 25);
    this.updateChart(historicalOxygenCanvas, 'Historical Oxygen (%)', this.historicalLabels.map(date => this.historicalOxygenData[date][0]), 'yellow', this.historicalLabels, 60, 100);
    this.updateChart(historicalAirTempCanvas, 'Historical Humidity (%)', this.historicalLabels.map(date => this.historicalAirTempData[date][0]), 'grey', this.historicalLabels, 60, 70);
  }
}
















  ngAfterViewInit() {
    console.log('Initializing charts...');
    this.createChart(this.heartRateChart.nativeElement, 'Heart Rate (BPM)', this.heartRateData, 'purple', this.heartRateLabels, 0, 120);
    this.createChart(this.temperatureChart.nativeElement, 'Temperature (°C)', this.temperatureData, 'blue', this.temperatureLabels, 15, 25);
    this.createChart(this.oxygenChart.nativeElement, 'Oxygen (%)', this.oxygenData, 'yellow', this.oxygenLabels, 60, 100);
    this.createChart(this.airTempChart.nativeElement, 'Humidity (%)', this.airTempData, 'grey', this.airTempLabels, 60, 70);
  }

  fetchSensorData(): void {
    if (!this.patientId) {
      console.error('No patient ID available to fetch sensor data.');
      this.sensorDataError = 'Cannot fetch sensor data. Please log in again.';
      return;
    }

    this.isLoadingSensorData = true;
    this.sensorDataError = null;

    this.http.get<SensorData[]>(`http://localhost:8080/api/sensor/data/${this.patientId}`).subscribe({
      next: (data: SensorData[]) => {
        this.isLoadingSensorData = false;
        console.log('Sensor data received:', data);
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

          console.log('Temperature data:', this.temperatureData, 'Labels:', this.temperatureLabels);
          console.log('Humidity data:', this.airTempData, 'Labels:', this.airTempLabels);

          this.updateChart(this.temperatureChart.nativeElement, 'Temperature de l\'air (°C)', this.temperatureData, 'blue', this.temperatureLabels, 15, 25);
          this.updateChart(this.airTempChart.nativeElement, 'Humidity (%)', this.airTempData, 'grey', this.airTempLabels, 60, 80)
          this.updateHealthStatus();
        } else {
          this.sensorDataError = 'No sensor data available for this patient.';
          console.warn('No sensor data received.');
        }
      },
      error: (err) => {
        this.isLoadingSensorData = false;
        console.error('Error fetching sensor data:', err);
        this.sensorDataError = 'Failed to load sensor data. Please try again later.';
      }
    });
  }

  fetchHeartRateData(): void {
    if (!this.patientId) {
      console.error('No patient ID available to fetch heart rate data.');
      this.heartRateDataError = 'Cannot fetch heart rate data. Please log in again.';
      return;
    }

    this.isLoadingHeartRateData = true;
    this.heartRateDataError = null;

    console.log('Fetching heart rate data for patientId:', this.patientId);

    this.http.get<HeartRateData[]>(`http://localhost:8080/api/heartrate/data/${this.patientId}`).subscribe({
      next: (data: HeartRateData[]) => {
        this.isLoadingHeartRateData = false;
        console.log('Heart rate data received:', data);
        if (data && data.length > 0) {
          this.heartRateData = [];
          this.oxygenData = [];
          this.heartRateLabels = [];
          this.oxygenLabels = [];

          const recentData = data.slice(-7);

          recentData.forEach((entry) => {
            const heartRate = entry.heartRate ?? 0;
            const spo2 = entry.spo2 ?? 0;
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            if (heartRate > 0) {
              this.heartRateData.push(heartRate);
              this.heartRateLabels.push(timestamp);
            }
            if (spo2 > 0) {
              this.oxygenData.push(spo2);
              this.oxygenLabels.push(timestamp);
            }
          });

          const latest = data[data.length - 1];
          this.heartRate = latest.heartRate ?? this.heartRate;
          this.oxygen = latest.spo2 ?? this.oxygen;

          console.log('Heart rate data:', this.heartRateData, 'Labels:', this.heartRateLabels);
          console.log('Oxygen data:', this.oxygenData, 'Labels:', this.oxygenLabels);
          console.log('Latest heart rate:', this.heartRate, 'Latest oxygen:', this.oxygen);

          this.updateChart(this.heartRateChart.nativeElement, 'Heart Rate (BPM)', this.heartRateData, 'purple', this.heartRateLabels, 70, 150);
          this.updateChart(this.oxygenChart.nativeElement, 'Oxygen (%)', this.oxygenData, 'yellow', this.oxygenLabels, 60, 100);
          this.updateHealthStatus();
        } else {
          this.heartRateDataError = 'No heart rate data available for this patient.';
          console.warn('No heart rate data received.');
        }
      },
      error: (err) => {
        this.isLoadingHeartRateData = false;
        console.error('Error fetching heart rate data:', err);
        this.heartRateDataError = 'Failed to load heart rate data. Please try again later.';
      }
    });
  }

  createChart(canvas: HTMLCanvasElement, label: string, data: number[], color: string, labels: string[] = [], minY: number = 0, maxY: number = 100) {
    console.log(`Creating chart for ${label} with data:`, data, 'and labels:', labels);
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          borderColor: color,
          borderWidth: 2,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: color
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          x: { display: true },
          y: {
            display: true,
            beginAtZero: false,
            min: minY,
            max: maxY
          }
        }
      }
    });
  }

  updateChart(canvas: HTMLCanvasElement, label: string, data: number[], color: string, labels: string[], minY: number = 0, maxY: number = 100) {
    console.log(`Updating chart for ${label} with data:`, data, 'and labels:', labels);
    const chart = Chart.getChart(canvas);
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].label = label;
      chart.data.datasets[0].borderColor = color;
      chart.options.scales!['y']!.min = minY;
      chart.options.scales!['y']!.max = maxY;
      chart.update();
    } else {
      console.warn(`Chart not found for ${label}, creating new chart.`);
      this.createChart(canvas, label, data, color, labels, minY, maxY);
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
      this.addNotification('Fréquence cardiaque anormale détectée !');
    }
    if (this.temperature < 20 || this.temperature > 23) {
      alerts++;
      this.addNotification('Température anormale détectée !');
    }
    if (this.oxygen < 90) {
      alerts++;
      this.addNotification('Niveau d\'oxygène bas détecté !');
    }
    if (this.airTemperature < 30 || this.airTemperature > 80) {
      alerts++;
      this.addNotification('Humidité extrême détectée !');
    }
    this.healthStatus = alerts > 0 ? (alerts > 1 ? 'Critique' : 'Alerte') : 'Normale';
    if (alerts > 0) {
      this.sendAlert();
    }
    console.log('Health status updated:', this.healthStatus);
  }

  addNotification(message: string) {
    if (this.notifications.length >= 5) {
      this.notifications.shift();
    }
    this.notifications.push(message);
    console.log('Notification added:', message);
  }

  sendAlert() {
    const doctorPhone = '+21653336990';
    const alertData = {
      heartRate: this.heartRate,
      temperature: this.temperature,
      oxygen: this.oxygen,
      airTemperature: this.airTemperature,
      doctorPhone: doctorPhone,
      patientName: this.patientName
    };
    console.log('Sending alert with data:', alertData);
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
        return value < 15 || value > 27 ? 'danger' :
               value < 19.5 || value > 24.5 ? 'warning' :
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
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}