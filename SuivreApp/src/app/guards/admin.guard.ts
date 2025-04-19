import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';


@Injectable({
  providedIn: 'root' // Make sure the guard is available throughout the app
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    console.log('AdminGuard triggered'); // Add this line to check if the guard is activated

    if (token && user.role === 'ADMIN' && user.email === 'admin@gmail.com') {
      return true;
    }

    this.router.navigate(['/unauthorized']); // Navigate to a different page if not authorized
    return false;
  }
}