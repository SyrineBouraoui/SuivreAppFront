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
      // Store the original message for display
      const displayMessage = this.newMessage.trim();
      // Normalize the message to lowercase for processing
      const normalizedMessage = this.newMessage.trim().toLowerCase();

      // Add the original message to the UI
      this.messages.push({ sender: 'Vous', message: displayMessage });

      // Send the normalized message to the chatbot service
      this.chatbotService.askChatbot(normalizedMessage).subscribe({
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
    this.router.navigate(['/chat']);
  }
}