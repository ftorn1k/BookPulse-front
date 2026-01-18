import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenreStat, GoogleBookDTO, MonthStat, MyBookDto, CollectionDto, ReviewDto } from './types';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  get stats(){
    return this.http.get<{ genres: GenreStat[]; months: MonthStat[] }>(`${this.baseUrl}/me/stats`)
  }

  changeName(name:string){
    return this.http.patch(`${this.baseUrl}/me/profile`, { name })
  }
  
  changePassword(password:string){
    return this.http.patch(`${this.baseUrl}/me/password`, { password: password })
  }

  get topWeekBooks(){
    return this.http.get<GoogleBookDTO[]>(`${this.baseUrl}/books/google?q=${encodeURIComponent('бестселлеры')}&max=10`)   
  }

  get forYouBooks(){
    return this.http.get<GoogleBookDTO[]>(`${this.baseUrl}/books/google?q=${encodeURIComponent('современная проза')}&max=10`)
  }

  search(q:string){
    return this.http.get<GoogleBookDTO[]>(`${this.baseUrl}/books/google?q=${encodeURIComponent(q)}&max=20`)   
  }
  getBookInfo(id:string){
    return this.http.get<GoogleBookDTO>(`${this.baseUrl}/books/google/${encodeURIComponent(id)}`)
  }

  addBook(book: GoogleBookDTO, status: 'planned'|'reading'|'finished'|'dropped'){
    return this.http.post(
        `${this.baseUrl}/me/books`,
        {
          googleId: book.id, 
          title: book.title,
          author: book.author ?? '',
          coverUrl: book.coverUrl ?? '',
          description: book.description ?? '',
          categories: book.categories ?? [],
          publishedYear: book.publishedYear ?? 0,
          pageCount: book.pageCount ?? 0,
          maturity: book.maturity ?? 'NOT_MATURE',
          status,
        },
      )
  }

  get myBooks(){
    return this.http.get<MyBookDto[]>(`${this.baseUrl}/me/books`)      
  }

  get myCollections(){
    return this.http.get<CollectionDto[]>(`${this.baseUrl}/me/collections`)   
  }

  createCollection(name: string, ids: number[]){
    return this.http.post(`${this.baseUrl}/me/collections`,{ name, bookIds: ids})
  }

  changeBookStatus(bookId: number, status: MyBookDto['status']){
    return this.http.patch(`${this.baseUrl}/me/books/status`,{ bookId: bookId, status })
  }

  addBookToCollection(collectionId: number, googleId: string){
    return this.http.post(`${this.baseUrl}/me/collections/add-books`,{ collectionId, googleIds: [googleId] })
  }

  loadReviews(googleId: string){
    return this.http.get<ReviewDto[]>(`${this.baseUrl}/books/reviews/${encodeURIComponent(googleId)}`)
  }

  submitReview(id: string, rating: number, text: string){
    return this.http.post<ReviewDto>(`${this.baseUrl}/books/reviews/${encodeURIComponent(id)}`,{ rating, text })
  }

}

