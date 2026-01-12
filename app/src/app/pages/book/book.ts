import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BookCard } from '../../shared/components/book-card/book-card';
import { AuthService, MeUser } from '../../core/auth/auth.service';
import { computed } from '@angular/core';



type CollectionDto = { id: number; name: string; count: number };
type UiBook = { id: string; title: string; author: string; coverUrl: string; rating?: number };

type BookDetails = {
  description?: string;
  genres?: string[];
  publishedYear?: number;
  pages?: number;
  age?: string;
  myRating?: number;
  reviews?: Array<{ id: string; userName: string; createdAt: string; rating?: number; text: string }>;
};

@Component({
  selector: 'app-book-page',
  standalone: true,
  imports: [CommonModule, BookCard],
  templateUrl: './book.html',
})
export class Book implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  leftCard: UiBook = { id: '', title: '', author: '', coverUrl: '', rating: 0 };
  book: BookDetails = { myRating: 0, reviews: [] };

hoveredStar = 0;
 private auth = inject(AuthService);

  user = signal<MeUser | null>(null);

  initials = computed(() => {
    const u = this.user();
    if (!u?.name) return 'U';
    return u.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(x => x[0]?.toUpperCase())
      .join('');
  });

  constructor() {

    this.auth.loadMe().subscribe((u) => this.user.set(u));
  }
setMyRating(s: number) {

  const val = Math.max(1, Math.min(5, s));
  this.book.myRating = val;
}


  addToCollectionOpen = signal(false);
  collectionsList = signal<CollectionDto[]>([]);
  addToCollectionError = signal('');


  reviewText = signal('');
  reviewError = signal('');
  sendingReview = signal(false);

  openAddToCollection() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigateByUrl('/auth');
      return;
    }

    this.addToCollectionError.set('');
    this.addToCollectionOpen.set(true);

    this.http.get<CollectionDto[]>('/api/me/collections', {
      headers: { Authorization: `Bearer ${token}` },
    }).subscribe({
      next: (list) => this.collectionsList.set(list ?? []),
      error: () => this.collectionsList.set([]),
    });
  }

  closeAddToCollection() {
    this.addToCollectionOpen.set(false);
  }

  private ensureInLibrary(status: 'planned'|'reading'|'finished'|'dropped' = 'planned') {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigateByUrl('/auth');
      return;
    }

    return this.http.post(
      '/api/me/books',
      {
        googleId: this.leftCard.id,
        title: this.leftCard.title,
        author: this.leftCard.author ?? '',
        coverUrl: this.leftCard.coverUrl ?? '',
        pageCount: this.book.pages ?? 0,
        categories: this.book.genres ?? [],
        description: this.book.description ?? '',
        publishedYear: this.book.publishedYear ?? 0,
        maturity: this.book.age === '18+' ? 'MATURE' : 'NOT_MATURE',
        status,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  addCurrentBookToCollection(collectionId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigateByUrl('/auth');
      return;
    }

    this.addToCollectionError.set('');

    this.ensureInLibrary('planned')?.subscribe({
      next: () => {
        this.http.post(
          '/api/me/collections/add-books',
          { collectionId, googleIds: [this.leftCard.id] },
          { headers: { Authorization: `Bearer ${token}` } }
        ).subscribe({
          next: () => this.closeAddToCollection(),
          error: (e) => {
            this.addToCollectionError.set(
              (typeof e?.error === 'string' && e.error) ||
              e?.error?.message ||
              'Ошибка добавления в коллекцию'
            );
          }
        });
      },
      error: (e) => {
        this.addToCollectionError.set(
          (typeof e?.error === 'string' && e.error) ||
          e?.error?.message ||
          'Не удалось добавить книгу в библиотеку'
        );
      }
    });
  }
  reviews = signal<Array<{ id: string; userName: string; createdAt: string; rating?: number; text: string }>>([]);

loadReviews(googleId: string) {
  this.http.get<any[]>(`/api/books/reviews/${encodeURIComponent(googleId)}`).subscribe({
    next: (list) => {
      this.reviews.set((list ?? []).map(r => ({
  id: String(r.id),
  userName: r.userName,
  createdAt: r.createdAt,
  rating: r.rating,
  text: r.text,
})));

    },
    error: () => {
      this.book.reviews = [];
    }
  });
}

  myInitials() {
    return 'OP';
  }

  initialsFromName(name: string) {
    if (!name) return 'U';
    return name.trim().split(/\s+/).slice(0,2).map(x => x[0]?.toUpperCase()).join('');
  }
openBook(b: { id: string }) {
  this.router.navigate(['/book', b.id]);
}
loading = signal(true);

ngOnInit() {
  const id = this.route.snapshot.paramMap.get('id');
  
  if (!id) {
    this.router.navigateByUrl('/');
    return;
  }

  this.loading.set(true);

  this.http.get<any>(`/api/books/google/${encodeURIComponent(id)}`).subscribe({
    next: (full) => {
      this.leftCard = {
        id: full.id,
        title: full.title ?? 'Без названия',
        author: full.author ?? '—',
        coverUrl: full.coverUrl ?? 'icons/no-cover.svg',
        rating: full.rating ?? 0,
      };

      this.book = {
        description: full.description ?? '',
        genres: full.categories ?? full.genres ?? [],
        publishedYear: full.publishedYear ?? null,
        pages: full.pageCount ?? full.pages ?? null,
        age: full.ageRating ?? full.age ?? '',
        myRating: 0,
        reviews: [],
      };

this.loadReviews(id);
      this.loading.set(false);
    },
    error: () => {
      this.loading.set(false);
      this.router.navigateByUrl('/');
    },
  });
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
addBookWithStatus(book: UiBook, status: 'planned'|'reading'|'finished'|'dropped') {
  const token = localStorage.getItem('token');
  if (!token) {
    this.router.navigateByUrl('/auto');
    return;
  }

  this.http.get<any>(`/api/books/google/${encodeURIComponent(book.id)}`).subscribe({
    next: (full) => {
      this.http.post(
        '/api/me/books',
        {
          googleId: full.id,
          title: full.title,
          author: full.author ?? '',
          coverUrl: full.coverUrl ?? '',
          description: full.description ?? '',
          categories: full.categories ?? [],
          publishedYear: full.publishedYear ?? 0,
          pageCount: full.pageCount ?? 0,
          maturity: full.maturity ?? 'NOT_MATURE',
          status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).subscribe({
        next: () => {
          console.log('✅ added');
        },
        error: (e) => {
          console.error('❌ add error', e);
          alert('Ошибка добавления книги');
        },
      });
    },
    error: () => {
      alert('Не удалось получить детали книги');
    },
  });
}

chooseStatus(status: 'planned'|'reading'|'finished'|'dropped') {
  const b = this.statusBook;
  if (!b) return;

  this.closeStatusModal();
  this.addBookWithStatus(b, status); 
}


submitReview() {
  const token = localStorage.getItem('token');
  if (!token) {
    this.router.navigateByUrl('/auth');
    return;
  }

  const text = this.reviewText().trim();
  const rating = this.book.myRating ?? 0;

  if (!rating) {
    this.reviewError.set('Сначала поставь “Мою оценку” (звёзды выше).');
    return;
  }
  if (!text) {
    this.reviewError.set('Текст отзыва обязателен.');
    return;
  }

  const id = this.route.snapshot.paramMap.get('id');
  if (!id) return;

  this.reviewError.set('');
  this.sendingReview.set(true);

  this.ensureInLibrary('planned')?.subscribe({
    next: () => {
      this.http.post<any>(
        `/api/books/reviews/${encodeURIComponent(id)}`,
        { rating, text },
        { headers: { Authorization: `Bearer ${token}` } }
      ).subscribe({
        next: (saved) => {
          const mapped = {
            id: String(saved.id),
            userName: saved.userName,
            createdAt: saved.createdAt,
            rating: saved.rating,
            text: saved.text,
          };


          this.reviews.update(prev => [mapped, ...prev]);

          this.reviewText.set('');
          this.sendingReview.set(false);
        },
        error: (e) => {
          this.sendingReview.set(false);
          this.reviewError.set(e?.error?.message || 'Не удалось отправить отзыв.');
        }
      });
    },
    error: (e) => {
      this.sendingReview.set(false);
      this.reviewError.set(e?.error?.message || 'Не удалось добавить книгу в библиотеку.');
    }
  });
}


}
