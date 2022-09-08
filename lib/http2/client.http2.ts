import * as http2 from 'http2';
import { Observable } from 'rxjs';
import { ClientHttp2Session, ClientHttp2Stream, constants } from 'http2';
import { Http2ClientOptions, Http2Response } from './type/client-http2.type';
import { QueryParser } from '../parser';

const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_AUTHORIZATION,
  HTTP2_HEADER_ACCEPT,
  HTTP2_HEADER_CONTENT_TYPE,
  HTTP2_HEADER_CONTENT_LENGTH,
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_SCHEME,
} = constants;

const DEFAULT_TIMEOUT = 3000;

export class ClientHttp2 {
  public isConnected = false;
  private clientSession: ClientHttp2Session;
  private readonly http2ClientOptions: Http2ClientOptions;

  public constructor(options: Http2ClientOptions) {
    ClientHttp2.setDefault(options);
    this.http2ClientOptions = options;
  }

  private static setDefault(options: Http2ClientOptions) {
    if(!options.timeout) {
      options.timeout = DEFAULT_TIMEOUT;
    }
    if(!options.alpnProtocol) {
      options.alpnProtocol = []
    }
    if(!options.ssl) {
      options.ssl = {
        ca: undefined,
        key: undefined,
        cert: undefined,
      }
    }
  }

  private buildBasicAuth() {
    if(!this.http2ClientOptions.authorization) {
      return ;
    }
    try {
      const { authorization } = this.http2ClientOptions;
      const { username, password } = authorization;
      const encoded = Buffer.from(`${username}:${password}`).toString('base64');
      return `Basic ${encoded}`;
    } catch (e) {
      throw new Error('Build auth token fail');
    }
  }

  public async startSession(): Promise<ClientHttp2Session> {
    const { url, timeout ,ssl} = this.http2ClientOptions;

    return new Promise((resolve, reject) => {
      this.clientSession = http2.connect(url, {
        ...ssl,
        timeout: timeout,
        ALPNProtocols: [],
      });
      this.clientSession.setTimeout(timeout, () => {
        if (this.isConnected === false) {
          this.clientSession.destroy(new Error('Connection timeout'));
        }
      });
      this.clientSession.on('connect', () => {
        this.isConnected = true;
        resolve(this.clientSession);
      });
      this.clientSession.on('error', (clientSessionException) => {
        reject(clientSessionException);
        this.clientSession.close();
      });
    });
  }

  public endSession(): void {
    this.isConnected = false;
    if (this.clientSession) {
      if (this.clientSession.destroyed) {
        return;
      }
      return this.clientSession.destroy();
    }
  }

  public request<T = any>(
    path: string,
    buffer: Buffer,
    accept?: string
  ): Promise<Http2Response<T>>  {
    const requestHeaders = {
      [HTTP2_HEADER_SCHEME]: 'http',
      [HTTP2_HEADER_METHOD]: 'POST',
      [HTTP2_HEADER_PATH]: path,
      [HTTP2_HEADER_ACCEPT]: accept || 'application/json',
      [HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
      [HTTP2_HEADER_CONTENT_LENGTH]: buffer ? buffer.length: 0,
    };

    const authToken = this.buildBasicAuth();

    if (authToken) {
      requestHeaders[HTTP2_HEADER_AUTHORIZATION] = authToken;
    }

    const request = this.clientSession.request(requestHeaders, {
      endStream: false,
    });

    request.setEncoding('utf8');

    const handle = this.handleResponse<T>(request);

    if(buffer) {
      request.write(buffer);
    }

    request.end();

    return handle;
  }

  public streamRequest<T = any>(
    path: string,
    buffer: Buffer,
    accept?: string
  ):  Observable<Http2Response<T>> {
    const requestHeaders = {
      [HTTP2_HEADER_SCHEME]: 'http',
      [HTTP2_HEADER_METHOD]: 'POST',
      [HTTP2_HEADER_PATH]: path,
      [HTTP2_HEADER_ACCEPT]: accept || 'application/json',
      [HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
      [HTTP2_HEADER_CONTENT_LENGTH]: buffer ? buffer.length: 0,
    };

    const authToken = this.buildBasicAuth();

    if (authToken) {
      requestHeaders[HTTP2_HEADER_AUTHORIZATION] = authToken;
    }

    const request = this.clientSession.request(requestHeaders, {
      endStream: false,
    });

    request.setEncoding('utf8');

    const handle = this.makeObservable<T>(request);

    if(buffer) {
      request.write(buffer);
    }

    request.end();

    return handle;
  }

  protected makeObservable<T>(request: ClientHttp2Stream): Observable<Http2Response<T>> {
    return new Observable<Http2Response<T>>((subscriber) => {

      let status;
      let error;
      let data;

      request.on('response', (headers) => {
        status = headers[':status'];
      });

      request.on('data', (chunkData) => {
        subscriber.next({
          data: ClientHttp2.safeJsonParse(chunkData),
          status: status,
          error: error,
        });
      });

      request.on('error', (error) => {
        subscriber.error({
          data: data,
          status: status,
          error: error,
        });
      });

      request.on('end', () => {
        subscriber.complete();
      });
    });
  }

  protected handleResponse<T = any>(request: ClientHttp2Stream): Promise<Http2Response<T>> {
    return new Promise( (resolve, reject) => {
      let status;
      let error;
      let data = [];

     const queryParser = new QueryParser();

      request.on('response', (headers) => {
        status = headers[':status'];
      });

      request.on('data', (chunkData) => {
        if(!queryParser.headers) {
          queryParser.headers =  ClientHttp2.safeJsonParse(chunkData);
        } else {
          data.push(queryParser.parse(ClientHttp2.safeJsonParse(chunkData)));
        }
      });

      request.on('error', (error) => {
         reject({
           data: undefined,
           status: status,
           error: error
         })
      });

      request.on('end', () => {
        const res: Http2Response = {
          headers: queryParser.headers,
          data: data,
          status: status,
          error: error
        };
        resolve(res)
      });



    })
  }

  private static safeJsonParse(raw:any) {
    try {
      return JSON.parse(raw);
    } catch (ex) {
      console.warn('Cant parse json');
      return raw;
    }
  }
}
