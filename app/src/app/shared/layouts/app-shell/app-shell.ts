import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../layouts/header/header';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [Header, RouterOutlet],
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
  `,
})
export class AppShell {}
