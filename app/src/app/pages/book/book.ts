import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {BookCard} from '../../shared/components/book-card/book-card';
import {AuthService, MeUser} from '../../core/auth/auth.service';
import {CollectionDto, GoogleBookDTO} from '../../core/types';
import {ApiService} from '../../core/api';
import {catchError, firstValueFrom, of} from 'rxjs';

@Component({
    selector: 'app-book-page',
    standalone: true,
    imports: [CommonModule, BookCard],
    templateUrl: './book.html',
})
export class Book implements OnInit {
    book?: GoogleBookDTO;
    myRating = 0;
    hoveredStar = 0;
    user = signal<MeUser | null>(null);
    addToCollectionOpen = signal(false);
    collectionsList = signal<CollectionDto[]>([]);
    addToCollectionError = signal('');
    reviewText = signal('');
    reviewError = signal('');
    sendingReview = signal(false);
    bookRating = signal(0)
    reviews = signal<Array<{ id: string; userName: string; createdAt: string; rating?: number; text: string }>>([]);
    loading = signal(true);
    statusModalOpen = false;
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    constructor(private api: ApiService, private auth: AuthService) {
        this.auth.loadMe().subscribe((u) => this.user.set(u));
    }

    setMyRating(s: number) {

        const val = Math.max(1, Math.min(5, s));
        this.myRating = val;
    }

    openAddToCollection() {
        this.addToCollectionError.set('');
        this.addToCollectionOpen.set(true);

        this.api.myCollections.subscribe({
            next: (list) => this.collectionsList.set(list ?? []),
            error: () => this.collectionsList.set([]),
        });
    }

    closeAddToCollection() {
        this.addToCollectionOpen.set(false);
    }

    async addCurrentBookToCollection(collectionId: number) {
        if (!this.book) return;
        this.addToCollectionError.set('');
        let bookInfo = await firstValueFrom(this.api.getBookInfo(this.book.id).pipe(
            catchError(() => of(null))
        ))
        if (!bookInfo) {
            this.addToCollectionError.set('Не удалось добавить книгу в библиотеку')
            return;
        }
        this.api.addBookToCollection(collectionId, this.book?.id ?? "").subscribe({
            next: () => this.closeAddToCollection(),
            error: (e) => {
                this.addToCollectionError.set(
                    (typeof e?.error === 'string' && e.error) ||
                    e?.error?.message ||
                    'Ошибка добавления в коллекцию'
                );
            }
        });
    }

    loadReviews(googleId: string) {
        this.api.loadReviews(googleId).subscribe({
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
                this.reviews.set([])
            }
        });
    }

    openBook(b: { id: string }) {
        this.router.navigate(['/book', b.id]);
    }

    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            await this.router.navigate(['/']);
            return;
        }

        this.loading.set(true);
        let bookInfo = await firstValueFrom(this.api.getBookInfo(id).pipe(
            catchError(() => of(null))
        ));
        if (!bookInfo) {
            await this.router.navigate(['/']);
            return;
        }
        this.book = bookInfo;
        let reviewsList = await firstValueFrom(this.api.loadReviews(id).pipe(
            catchError(() => of([]))
        ));
        this.reviews.set(reviewsList ?? [])

        let avgRating = 0;
        if (reviewsList && reviewsList.length > 0) {
            const total = reviewsList.reduce((sum, r) => sum + (r.rating ?? 0), 0);
            avgRating = total / reviewsList.length;
        }
        this.bookRating.set(avgRating);
        this.loading.set(false);
    }

    openStatusModal() {
        this.statusModalOpen = true;
    }

    closeStatusModal() {
        this.statusModalOpen = false;
    }

    async addBookWithStatus(book: GoogleBookDTO, status: 'planned' | 'reading' | 'finished' | 'dropped') {

        let bookInfo = await firstValueFrom(this.api.getBookInfo(book.id).pipe(
            catchError(() => of(null))
        ))
        if (!bookInfo) {
            alert('Не удалось получить детали книги');
            return;
        }

        this.api.addBook(bookInfo, status).subscribe({
            next: () => {
                console.log('added');
            },
            error: (e) => {
                console.error('add error', e);
                alert('Ошибка добавления книги');
            },
        });
    }

    chooseStatus(status: 'planned' | 'reading' | 'finished' | 'dropped') {
        const b = this.book;
        if (!b) return;

        this.closeStatusModal();
        this.addBookWithStatus(b, status);
    }


    async submitReview() {
        const text = this.reviewText().trim();
        const rating = this.myRating ?? 0;

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
        if (!this.book) return;
        this.reviewError.set('');
        this.sendingReview.set(true);
        let bookInfo = await firstValueFrom(this.api.getBookInfo(this.book.id).pipe(
            catchError(() => of(null))
        ))
        if (!bookInfo) {
            this.sendingReview.set(false);
            this.reviewError.set('Не удалось добавить книгу в библиотеку.');
            return;
        }
        this.api.submitReview(id, rating, text).subscribe({
            next: (saved) => {
                this.reviews.update(prev => [saved, ...prev]);
                this.reviewText.set('');
                this.sendingReview.set(false);
            },
            error: (e) => {
                this.sendingReview.set(false);
                this.reviewError.set(e?.error?.message || 'Не удалось отправить отзыв.');
            }
        });
    }

    displayMatureRating(rating?: string) {
        if (!rating) return "—";
        switch (rating) {
            case "NOT_MATURE":
                return "—";
            default:
                return rating;
        }
    }
}
