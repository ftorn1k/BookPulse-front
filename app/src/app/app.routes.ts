import { Routes } from '@angular/router';
import { AppShell } from './shared/layouts/app-shell/app-shell';
import { Main } from './pages/main/main';
import { Book } from './pages/book/book';
import { MyBooks } from './pages/my-books/my-books';
import { Profile } from './pages/profile/profile';
import { Reg } from './pages/reg/reg';
import { Auth } from './pages/auth/auth';

export const routes: Routes = [
  { path: 'reg', component: Reg },
  { path: 'auth', component: Auth },
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', component: Main},
      { path: 'book/:id', component: Book },
      { path: 'my-books', component: MyBooks },
      { path: 'profile', component: Profile },
    ],
  },

  { path: '**', redirectTo: '' },
];
