import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, MyBookDto } from './core/api';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  books: MyBookDto[] = [];
  loading = true;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.loading = false;
      return;
    }

    this.api.getMyBooks().subscribe({
      next: (data) => {
        this.books = data;
        this.loading = false;
        console.log('books loaded', data);
      },
      error: (e) => {
        console.error('API error', e);
        if (e?.status === 401) {
          localStorage.removeItem('token');
        }
        this.loading = false;
      },
    });
  }
  statusLabel(status: MyBookDto['status']): string {
    if (status === 'want') return 'Хочу прочитать';
    if (status === 'reading') return 'Читаю';
    return 'Прочитано';
  }
}
