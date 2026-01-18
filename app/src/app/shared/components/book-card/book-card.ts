import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GoogleBookDTO} from '../../../core/types';

type CardSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'app-book-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './book-card.html',
})
export class BookCard {
    @Input({required: true}) book!: GoogleBookDTO;
    @Input() rating?: number | null;
    @Input() size: CardSize = 'md';
    @Output() open = new EventEmitter<GoogleBookDTO>();
    @Output() add = new EventEmitter<GoogleBookDTO>();

    onOpen() {
        this.open.emit(this.book);
    }
} 
