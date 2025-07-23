import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserSearch } from '../interfaces/user-search.interface';

@Injectable({
  providedIn: 'root'
})
export class UserSearchService {
  private readonly API_URL = 'https://express-pg-app-qa.fly.dev/api/users/name-email';

  constructor(private http: HttpClient) {}

  searchUsers(query: string): Observable<UserSearch[]> {
    if (query.length < 3) {
      return new Observable(subscriber => subscriber.next([]));
    }
    return this.http.get<UserSearch[]>(`${this.API_URL}/${query}`);
  }
} 