import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

/**
 * Base backend service. Business services should import this instead of using HttpClient directly.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(private http: HttpClient) {}

  /**
   *
   * @param url URL to call
   * @param params optional parameters such as HttpHeaders, HttpParams, reportProgress etc.
   */
  public get(url: string, params?: any): Observable<any> {
    return this.invoke('GET', url, null, params);
  }

  /**
   *
   * @param url URL to call
   * @param data payload
   * @param params parameters such as HttpHeaders, HttpParams, reportProgress etc.
   */
  public put(url: string, data: any, params?: any): Observable<any> {
    return this.invoke('PUT', url, data, params);
  }

  /**
   *
   * @param url URL to call
   * @param data payload
   * @param params parameters such as HttpHeaders, HttpParams, reportProgress etc.
   */
  public patch(url: string, data: any, params?: any): Observable<any> {
    return this.invoke('PATCH', url, data, params);
  }

  /**
   *
   * @param url URL to call
   * @param data payload
   * @param params parameters such as HttpHeaders, HttpParams, reportProgress etc.
   */
  public post(url: string, data: any, params?: any): Observable<any> {
    return this.invoke('POST', url, data, params);
  }

  /**
   *
   * @param url URL to call
   * @param params parameters such as HttpHeaders, HttpParams, reportProgress etc.
   */
  public delete(url: string, params?: any): Observable<any> {
    return this.invoke('DELETE', url, null, params);
  }

  public login(url: string, data: any): Observable<any> {
    const requestUrl = `${url}`;
    return this.http.request('POST', requestUrl, {body: data, withCredentials: true});
  }

  private invoke(method: string, url: string, data: any = {}, params?: any): Observable<any> {
    const options = {
      body: data,
      params,
      headers: {
        'Accept-Language': 'ro'
      },
      withCredentials: true
    };
    if (!url) {
      throw new Error('No URL provided.');
    }
    const requestUrl = `${url}`;
    return this.http.request(method, requestUrl, options);
  }
}
