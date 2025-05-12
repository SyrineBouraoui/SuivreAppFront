import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface SensorData {
  id: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}
export interface HeartRateData {
  id: number;
  heart_rate: number;
  spo2: number;
  timestamp: string;
  patientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SensorDataService {
  private apiUrl = 'http://localhost:8080/api/sensor/data';
  private heartRateApiUrl = 'http://localhost:8080/api/heartrate/data'; 

  constructor(private http: HttpClient) {}

  getSensorData(): Observable<SensorData[]> {
    return this.http.get<SensorData[]>(this.apiUrl);
  }
  getHeartRateData(patientId: string): Observable<HeartRateData[]> {
    return this.http.get<HeartRateData[]>(`${this.heartRateApiUrl}/${patientId}`);
  }
}