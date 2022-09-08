import { ClientSessionOptions, SecureClientSessionOptions } from 'http2';

export interface Http2Response<T = any> {
   state?: string;
   headers?: Record<string, any>
   data: T;
   status: number;
   message?: string;
   error?: any;

}

export interface Http2BasicCredentials  {
   username: string;
   password: string;
}

export interface Http2SSL {
   ca: string;
   key: string;
   cert: string;
}

export interface Http2ClientOptions {
   authorization?: Http2BasicCredentials;
   ssl?: Http2SSL;
   url: string;
   alpnProtocol?: string[];
   timeout?: number;
   sessionOptions?: ClientSessionOptions | SecureClientSessionOptions;
}

export interface RequestParam  {
   streamsProperties?: Record<string, any>;
   sessionVariables?: Record<string, any>;
   commandSequenceNumber?: number;
   [index: string]: any
}
