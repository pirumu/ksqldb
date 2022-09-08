import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import { Http2ClientOptions } from '../http2/type/client-http2.type';


export type KsqlDBModuleOptions = Http2ClientOptions;

export interface KsqlDBModuleOptionsFactory {
  createHttpOptions(): Promise<KsqlDBModuleOptions> | KsqlDBModuleOptions;
}

export interface KsqlDBModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<KsqlDBModuleOptionsFactory>;
  useClass?: Type<KsqlDBModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<KsqlDBModuleOptions> | KsqlDBModuleOptions;
  inject?: any[];
  extraProviders?: Provider[];
}