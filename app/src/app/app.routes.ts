import { Routes } from '@angular/router';
import { AppShell } from './shared/layouts/app-shell/app-shell';

export const routes: Routes = [
  { path: 'reg', loadComponent: () => import('./pages/reg/reg').then(m => m.Reg) },
    { path: 'auth', loadComponent: () => import('./pages/auth/auth').then(m => m.Auth) },
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', loadComponent: () => import('./pages/main/main').then(m => m.Main) },
      { path: 'book/:id', loadComponent: () => import('./pages/book/book').then(m => m.Book) },
      { path: 'my-books', loadComponent: () => import('./pages/my-books/my-books').then(m => m.MyBooks) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.Profile) },
    ],
  },

  { path: '**', redirectTo: '' },
];
