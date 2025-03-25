import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Message {
  id?: number;
  patientId: string| null ;
  doctorId: string ;
  sender: string;  // 'patient' or 'doctor'
  content: string;
  timestamp?: string;
  patientName: string | null | undefined; // Allow null or undefined

}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'http://localhost:8080/api/messages'; // Your backend URL

  constructor(private http: HttpClient) {}

  // Send a message
  sendMessage(message: Message): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/send`, message);
  }

  // Get messages between a patient and a doctor
  getMessages(patientId: string, doctorId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${patientId}/${doctorId}`);
  }
  
  sendMessageToPatients(patientIds: number[], message: string) {
    return this.http.post(this.apiUrl, { patientIds, message });
  }
  // Fetch all messages for a specific doctor
  getMessagesForDoctor(doctorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

 

}