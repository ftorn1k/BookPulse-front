import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MyBookDto, CollectionDto } from '../../core/types';
import { ApiService } from '../../core/api';

@Component({
  selector: 'app-my-books-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-books.html',
})
export class MyBooks implements OnInit{
  private router = inject(Router);

  loading = signal(true);
  books = signal<MyBookDto[]>([]);

  collectionsList = signal<CollectionDto[]>([]);

  selectedCollection = signal<string | null>(null);
  collectionsMenuOpen = signal(false);

  collections = computed(() => {
    const set = new Set<string>();
    for (const b of this.books()) {
      (b.collections ?? []).forEach((c) => c && set.add(c));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });
  collectionsScroll = computed(() => this.collections().length > 4);


  filteredBooks = computed(() => {
    const c = this.selectedCollection();
    if (!c) return this.books();
    return this.books().filter((b) => (b.collections ?? []).includes(c));
  });

  createModalOpen = signal(false);
  newCollectionName = signal('');
  selectedBookIds = signal<Set<number>>(new Set());
  creatingCollection = signal(false);
  createError = signal('');

  statusMenuBook = signal<MyBookDto | null>(null);

  addToCollectionOpen = signal(false);
  addToCollectionBook = signal<MyBookDto | null>(null);
  addToCollectionError = signal('');
  constructor(private api: ApiService){}
  ngOnInit() {
    this.load();
  }

  private getTokenOrRedirect(): string | null {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigateByUrl('/auto');
      return null;
    }
    return token;
  }

  load() {
    this.loading.set(true);
    console.log("loading")
    this.api.myBooks.subscribe({
        next: (data) => {
          this.books.set(data ?? []);
          this.loading.set(false);

          this.loadCollections();
        },
        error: (e) => {
          console.log(e)
          this.loading.set(false);
          this.router.navigateByUrl('/auto');
        },
      });
  }

  private loadCollections() {
    const token = this.getTokenOrRedirect();
    if (!token) return;

    this.api.myCollections.subscribe({
        next: (cols) => this.collectionsList.set(cols ?? []),
        error: () => this.collectionsList.set([]),
      });
  }

  statusLabel(status: MyBookDto['status']): string {
    if (status === 'planned') return 'Хочу';
    if (status === 'reading') return 'Читаю';
    if (status === 'finished') return 'Прочитано';
    return 'Брошено';
  }

  toggleCollectionsMenu() {
    this.collectionsMenuOpen.set(!this.collectionsMenuOpen());
  }

  selectCollection(c: string | null) {
    this.selectedCollection.set(c);
    this.collectionsMenuOpen.set(false);
  }

  openCreateCollection() {
    this.createError.set('');
    this.newCollectionName.set('');
    this.selectedBookIds.set(new Set());
    this.createModalOpen.set(true);
  }

  closeCreateCollection() {
    this.createModalOpen.set(false);
  }


  openBook(b: MyBookDto) {
  this.router.navigate(['/book', b.googleId]);
}

  toggleBookSelection(bookId: number) {
    const next = new Set(this.selectedBookIds());
    if (next.has(bookId)) next.delete(bookId);
    else next.add(bookId);
    this.selectedBookIds.set(next);
  }

  createCollection() {
    const token = this.getTokenOrRedirect();
    if (!token) return;

    const name = this.newCollectionName().trim();
    if (!name) {
      this.createError.set('Название коллекции обязательно');
      return;
    }

    const ids = Array.from(this.selectedBookIds());
    if (ids.length === 0) {
      this.createError.set('Выбери хотя бы одну книгу');
      return;
    }

    this.creatingCollection.set(true);
    this.createError.set('');

    this.api.createCollection(name, ids).subscribe({
        next: () => {
          this.creatingCollection.set(false);
          this.closeCreateCollection();
          this.load();
        },
        error: (e) => {
          this.creatingCollection.set(false);
          this.createError.set(
            (typeof e?.error === 'string' && e.error) ||
              e?.error?.message ||
              'Ошибка создания коллекции'
          );
        },
      });
  }

  openStatusMenu(b: MyBookDto) {
    const cur = this.statusMenuBook();
    if (cur?.bookId === b.bookId) {
      this.statusMenuBook.set(null);
      return;
    }
    this.statusMenuBook.set(b);
  }

  changeStatus(b: MyBookDto, status: MyBookDto['status']) {
    const token = this.getTokenOrRedirect();
    if (!token) return;

    this.api.changeBookStatus(b.bookId, status).subscribe({
        next: () => {
          this.statusMenuBook.set(null);
          this.load();
        },
        error: (e) => {
          this.statusMenuBook.set(null);
          alert(
            (typeof e?.error === 'string' && e.error) ||
              e?.error?.message ||
              `Ошибка смены статуса (${e.status})`
          );
        },
      });
  }

  openAddToCollection(b: MyBookDto) {
    this.statusMenuBook.set(null);
    this.addToCollectionError.set('');
    this.addToCollectionBook.set(b);
    this.addToCollectionOpen.set(true);
    this.loadCollections();
  }

  closeAddToCollection() {
    this.addToCollectionOpen.set(false);
    this.addToCollectionBook.set(null);
  }

  addBookToCollection(collectionId: number) {
    const token = this.getTokenOrRedirect();
    if (!token) return;

    const b = this.addToCollectionBook();
    if (!b) return;

    this.addToCollectionError.set('');

    this.api.addBookToCollection(collectionId, b.googleId).subscribe({
        next: () => {
          this.closeAddToCollection();
          this.load();
        },
        error: (e) => {
          this.addToCollectionError.set(
            (typeof e?.error === 'string' && e.error) ||
              e?.error?.message ||
              `Ошибка добавления в коллекцию (${e.status})`
          );
        },
      });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const t = e.target as HTMLElement;

    if (!t.closest('[data-collections-filter]')) {
      this.collectionsMenuOpen.set(false);
    }
    if (!t.closest('[data-status-menu]')) {
      this.statusMenuBook.set(null);
    }
  }
}
