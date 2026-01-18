import {ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BookCard} from '../../shared/components/book-card/book-card';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiService} from '../../core/api';
import {GoogleBookDTO} from '../../core/types';
import {catchError, firstValueFrom, of} from 'rxjs';


type HomeSections = {
    topWeek: GoogleBookDTO[];
    forYou: GoogleBookDTO[];
};

@Component({
    selector: 'app-main-page',
    standalone: true,
    imports: [CommonModule, FormsModule, BookCard],
    templateUrl: './main.html',
})
export class Main implements OnInit {
    booksRatings = new Map<string, number>();
    @ViewChild('topWeekStrip') topWeekStrip?: ElementRef<HTMLElement>;
    loading = true;
    sections: HomeSections = {topWeek: [], forYou: []};
    query = '';
    statusModalOpen = false;
    selectedBook: GoogleBookDTO | null = null;
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private byId = new Map<string, GoogleBookDTO>();
    private pending = 0;

    constructor(private api: ApiService) {
        this.route.queryParamMap.subscribe((pm) => {
            const q = (pm.get('q') || '').trim();
            if (q) {
                this.query = q;
                this.onSearch();
            }
        });
    }

    scrollTopWeek(dir: number) {
        const el = this.topWeekStrip?.nativeElement;
        if (!el) return;

        const card = 170;
        const gap = 24;
        const step = (card + gap) * 2;

        el.scrollBy({left: dir * step, behavior: 'smooth'});
    }

    async ngOnInit() {
        await this.loadTopWeek();
        await this.loadForYou();
        await this.loadBookRatings();
    }

    openStatusModal(book: GoogleBookDTO) {
        this.selectedBook = book;
        this.statusModalOpen = true;
    }

    closeStatusModal() {
        this.statusModalOpen = false;
        this.selectedBook = null;
    }

    chooseStatus(status: 'planned' | 'reading' | 'finished' | 'dropped') {
        const b = this.selectedBook;
        if (!b) return;

        this.closeStatusModal();
        this.addBookWithStatus(b, status);
    }
 
    onSearch() {
        const q = this.query.trim();
        if (!q) return;
        this.beginLoad();
        this.api.search(q).subscribe({
            next: (items) => {
                items.forEach((it) => this.byId.set(it.id, it));
                this.sections.forYou = items;
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

    openBook(book: GoogleBookDTO) {
        this.router.navigate(['/book', book.id]);
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

    async loadBookRatings() {
        this.beginLoad();
        const ids = Array.from(this.byId.keys());
        if (ids.length === 0) {
            this.endLoad();
            return;
        }
        for (const id of ids) {
            try {
                const reviewsList = await firstValueFrom(this.api.loadReviews(id).pipe(
                    catchError(() => of([]))
                ));
                let avgRating = 0;
                if (reviewsList && reviewsList.length > 0) {
                    const total = reviewsList.reduce((sum, r) => sum + (r.rating ?? 0), 0);
                    avgRating = total / reviewsList.length;
                }
                this.booksRatings.set(id, avgRating);
            } catch (e) {
                this.booksRatings.set(id, 0);
            }
        }
        this.endLoad();
        this.cdr.detectChanges();
    }

    async loadTopWeek() {
        this.beginLoad();

        let books = await firstValueFrom(this.api.topWeekBooks.pipe(
            catchError(() => of([]))
        ));
        books.forEach((it) => this.byId.set(it.id, it));
        this.sections.topWeek = books;
        this.endLoad();
        this.cdr.detectChanges();
    }

    async loadForYou() {
        this.beginLoad();

        let books = await firstValueFrom(this.api.forYouBooks.pipe(
            catchError(() => of([]))
        ));
        books.forEach((it) => this.byId.set(it.id, it));
        this.sections.forYou = books;
        this.endLoad();
        this.cdr.detectChanges();
    }

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


}
