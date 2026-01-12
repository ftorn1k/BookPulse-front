import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating?: number;
};
type CardSize = 'sm' | 'md' | 'lg';
@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-card.html',
})
export class BookCard {
  @Input({ required: true }) book!: UiBook;
  @Input() size: CardSize = 'md';
  @Output() open = new EventEmitter<UiBook>();
  @Output() add = new EventEmitter<UiBook>();
  onOpen() {
    this.open.emit(this.book);
  }
  onAdd(e: MouseEvent) {
    e.stopPropagation();
    this.add.emit(this.book);
  }
}
