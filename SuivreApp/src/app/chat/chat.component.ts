import { Component, OnInit } from '@angular/core';
import { ChatbotService } from '../services/chatbot.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: false,
  
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  messages: { sender: string, message: string }[] = [];
  newMessage: string = '';
  isChatbot: boolean = true; // Par défaut, nous commençons avec le chatbot

  constructor(private chatbotService: ChatbotService, private router: Router) {}

  ngOnInit(): void {
    // Message de bienvenue du chatbot
    this.messages.push({ sender: 'HeadicareBot', message: 'Bonjour ! Comment puis-je vous aider aujourd’hui ?' });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.messages.push({ sender: 'Vous', message: this.newMessage });
      this.chatbotService.askChatbot(this.newMessage).subscribe({
        next: (response) => {
          this.messages.push({ sender: 'HeadicareBot', message: response });
          if (response.includes('Souhaitez-vous contacter un agent de support ?')) {
            this.messages.push({
              sender: 'HeadicareBot',
              message: '<button class="support-btn" (click)="connectToSupport()">Contacter un Agent de Support</button>'
            });
          }
        },
        error: (err) => {
          this.messages.push({ sender: 'HeadicareBot', message: 'Désolé, une erreur s’est produite. Essayez à nouveau.' });
        }
      });
      this.newMessage = '';
    }
  }

  connectToSupport(): void {
    this.router.navigate(['/chat']); // Redirige vers une future route pour le chat humain
  }
}