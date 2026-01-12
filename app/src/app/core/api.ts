import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MyBookDto {
  bookId: number;
  title: string;
  author: string;
  status: 'want' | 'reading' | 'done';
  collections: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getMyBooks(): Observable<MyBookDto[]> {
    return this.http.get<MyBookDto[]>(`${this.baseUrl}/me/books`);
  }
}
