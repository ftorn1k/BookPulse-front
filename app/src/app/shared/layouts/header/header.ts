import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, MeUser } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
})
export class Header {
  private auth = inject(AuthService);
  private router = inject(Router);
  query = '';
  user = signal<MeUser | null>(null);
  menuOpen = signal(false);

  initials = computed(() => {
    const u = this.user();
    if (!u?.name) return '';
    return u.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join('');
  });

  constructor() {
    this.auth.loadMe().subscribe((u) => this.user.set(u));
  }

onSearch() {
  const q = this.query.trim();
  if (!q) return;

  this.router.navigate(['/'], { queryParams: { q } });

  this.menuOpen.set(false);
}


  get isAuthed() {
    return this.auth.isAuthed;
  }

  onAvatarClick() {
    if (!this.isAuthed) {
      this.router.navigateByUrl('/auth');
      return;
    }
    this.menuOpen.set(!this.menuOpen());
  }

  onMyBooksClick() {
    if (!this.isAuthed) {
      this.router.navigateByUrl('/auth');
      return;
    }
    this.menuOpen.set(false);
    this.router.navigateByUrl('/my-books');
  }

  logout() {
    this.auth.logout();
    this.user.set(null);
    this.menuOpen.set(false);
    this.router.navigateByUrl('/auth');
  }

  go(path: string) {
    this.menuOpen.set(false);
    this.router.navigateByUrl(path);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-user-menu-root]')) {
      this.menuOpen.set(false);
    }
  }
}
