import { Component, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookCard, UiBook } from '../../shared/components/book-card/book-card';
import { FormsModule } from '@angular/forms';
import { Router,ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api';
import { GoogleBookDTO } from '../../core/types';


type HomeSections = {
  topWeek: UiBook[];
  forYou: UiBook[];
};

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCard],
  templateUrl: './main.html',
})
export class Main {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
@ViewChild('topWeekStrip') topWeekStrip?: ElementRef<HTMLElement>;
  loading = true;
  sections: HomeSections = { topWeek: [], forYou: [] };
  query = '';

scrollTopWeek(dir: number) {
    const el = this.topWeekStrip?.nativeElement;
    if (!el) return;

    const card = 170;
    const gap = 24; 
    const step = (card + gap) * 2;

    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }
  
  private route = inject(ActivatedRoute);
  constructor(private api: ApiService) {
    this.loadTopWeek();
    this.loadForYou();
     this.route.queryParamMap.subscribe((pm) => {
    const q = (pm.get('q') || '').trim();
    if (q) {
      this.query = q;
      this.onSearch(); 
    }
  });
  }

  private toUi(items: GoogleBookDTO[]): UiBook[] {
    return items.map((b) => ({
      id: b.id,
      title: b.title || 'Без названия',
      author: b.author || '—',
      coverUrl: b.coverUrl || 'icons/no-cover.svg',
    }));
  }
  private byId = new Map<string, GoogleBookDTO>();
  private pending = 0;

private beginLoad() {
  this.pending++;
  this.loading = true;
}

private endLoad() {
  this.pending--;
  if (this.pending <= 0) {
    this.pending = 0;
    this.loading = false;
  }
  this.cdr.detectChanges();
}

  statusModalOpen = false;
statusBook: UiBook | null = null;

openStatusModal(book: UiBook) {
  this.statusBook = book;
  this.statusModalOpen = true;
}

closeStatusModal() {
  this.statusModalOpen = false;
  this.statusBook = null;
}

chooseStatus(status: 'planned'|'reading'|'finished'|'dropped') {
  const b = this.statusBook;
  if (!b) return;

  this.closeStatusModal();
  this.addBookWithStatus(b, status);
}

  loadTopWeek() {
    this.beginLoad();
    this.api.topWeekBooks.subscribe({
        next: (items) => {
          items.forEach((it) => this.byId.set(it.id, it));
          this.sections.topWeek = this.toUi(items);
          this.endLoad();
          this.cdr.detectChanges();
        },
        error: (e) => {
          console.error('topWeek error', e);
          this.endLoad();
            this.cdr.detectChanges();
        },
      });
  }

  loadForYou() {
    this.beginLoad();
    this.api.forYouBooks.subscribe({
        next: (items) => {
          items.forEach((it) => this.byId.set(it.id, it));
          this.sections.forYou = this.toUi(items);
          this.endLoad();
            this.cdr.detectChanges();
        },
        error: (e) => {
          console.error('forYou error', e);
          this.endLoad();
            this.cdr.detectChanges();
        },
      });
  }

  onSearch() {
    const q = this.query.trim();
    if (!q) return;
    this.beginLoad();
    this.api.search(q).subscribe({
        next: (items) => {
          items.forEach((it) => this.byId.set(it.id, it));
          this.sections.forYou = this.toUi(items);
          this.endLoad();
            this.cdr.detectChanges();
        },
        error: (e) => {
          console.error('search error', e);
          this.endLoad();
            this.cdr.detectChanges();
        },
      });
  }

openBook(book: UiBook) {
  this.router.navigate(['/book', book.id]);
}


addBookWithStatus(book: UiBook, status: 'planned'|'reading'|'finished'|'dropped') {
  const token = localStorage.getItem('token');
  if (!token) {
    this.router.navigateByUrl('/auto');
    return;
  }
  let bookInfo: GoogleBookDTO|null = null
  this.api.getBookInfo(book.id).subscribe({
    next: (full) => {
      bookInfo = full
    },
    error: (e) => {
      console.error('details error', e);
      alert('Не удалось получить детали книги');
    },
  });
  if(bookInfo)
    this.api.addBook(bookInfo, status)
}
}
