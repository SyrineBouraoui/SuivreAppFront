import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { UserService } from '../services/user.service';

// Define the User interface directly here
interface User {
  id?: number;
  username: string;
  email: string;
  role: string;
  password?: string;
  doctorId?: number | null;
}
@Component({
  selector: 'app-admin',
  standalone: false,
  
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})

  export class AdminComponent implements OnInit {
    users: any[] = [];
  doctors: any[] = [];
  showModal: boolean = false;
  isEditing: boolean = false;
  selectedUser: User = { username: '', email: '', role: '', doctorId: null, password: '' };
  errorMessage: string | null = null;
  router: any;
  authService: any;

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadDoctors();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        console.log('Users from backend:', data);
        this.users = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      }
    });
  }

  loadDoctors(): void {
    this.userService.getAllDoctors().subscribe({
      next: (data) => {
        console.log('Doctors from backend:', data);
        this.doctors = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching doctors:', err);
      }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.errorMessage = null;
    this.selectedUser = { username: '', email: '', role: '', doctorId: null, password: '' };
    this.showModal = true;
  }

  openEditModal(user: any): void {
    this.isEditing = true;
    this.errorMessage = null;
    this.selectedUser = { ...user, doctorId: user.doctorId || null, password: '' }; // Initialize password as empty

    if (user.role === 'PATIENT') {
      this.userService.getAllPatients().subscribe({
        next: (patients) => {
          const patient = patients.find(p => p.userId === user.id);
          if (patient) {
            this.selectedUser.doctorId = patient.doctorId || null;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching patients:', err);
          this.errorMessage = 'Failed to load patient data';
        }
      });
    } else if (user.role === 'DOCTOR') {
      this.userService.getAllDoctors().subscribe({
        next: (doctors) => {
          const doctor = doctors.find(d => d.email === user.email);
          if (doctor) {
            this.selectedUser.doctorId = doctor.id;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching doctors:', err);
          this.errorMessage = 'Failed to load doctor data';
        }
      });
    }

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMessage = null;
  }

  submitForm(): void {
    this.errorMessage = null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.selectedUser.email || !emailRegex.test(this.selectedUser.email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }
    if (!this.selectedUser.username || !this.selectedUser.role) {
      this.errorMessage = 'Email, username, and role are required.';
      return;
    }
    if (!this.isEditing && (!this.selectedUser.password || this.selectedUser.password.trim() === '')) {
      this.errorMessage = 'Password is required for new users.';
      return;
    }
    if (this.selectedUser.role === 'PATIENT' && !this.selectedUser.doctorId) {
      this.errorMessage = 'Please select a doctor for the patient.';
      return;
    }
    console.log('Submitting user:', this.selectedUser);
    if (this.isEditing) {
      this.userService.updateUser(this.selectedUser.id!, this.selectedUser).subscribe({
        next: (response) => {
          console.log('Update successful:', response);
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.errorMessage = 'Failed to update user: ' + (err.error?.message || err.message);
        }
      });
    } else {
      this.userService.addUser(this.selectedUser).subscribe({
        next: (response) => {
          console.log('User added successfully:', response);
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error adding user:', err);
          this.errorMessage = 'Failed to add user: ' + (err.error?.message || err.message);
        }
      });
    }
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          console.log('User deleted successfully');
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          this.errorMessage = 'Failed to delete user: ' + (err.error?.message || err.message);
        }
      });
    }
  }

  logout() {
    this.authService.logout();
  }

// Optionally, navigate to home or another page
goToHome() {
  this.router.navigate(['/']);
}}