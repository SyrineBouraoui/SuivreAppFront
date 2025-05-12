
// src/app/services/chatbot.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://localhost:8080/api/chatbot/ask'; // Ajustez selon votre URL backend

  constructor(private http: HttpClient) {}

  askChatbot(query: string): Observable<string> {
    return this.http.post(this.apiUrl, query, { responseType: 'text' });
  }
}