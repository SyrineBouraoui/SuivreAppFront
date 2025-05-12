import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { DoctorComponent } from './doctor/doctor.component';
import { PatientComponent } from './patient/patient.component';
import { AuthGuard } from './auth.guard';
import { AdminComponent } from './admin/admin.component';
import { AdminGuard } from './guards/admin.guard';
import { NotFoundComponent } from './not-found/not-found.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChatComponent } from './chat/chat.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'doctor/:id', component: DoctorComponent, canActivate: [AuthGuard] },
  { path: 'patient/:id', component: PatientComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'chatbot', component: ChatComponent },

  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent }, // Catch all invalid routes

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

