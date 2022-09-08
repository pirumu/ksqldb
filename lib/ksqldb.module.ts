import { KsqldbService } from './ksqldb.service';
import { ClientHttp2 } from './http2/client.http2';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { HTTP2_INSTANCE_TOKEN, KSQLDB_MODULE_ID, KSQLDB_MODULE_OPTIONS } from './ksqldb.constants';
import { KsqlDBModuleAsyncOptions, KsqlDBModuleOptions, KsqlDBModuleOptionsFactory } from './interfaces';

@Module({})
export class KsqlDBModule {
  public static register(config: KsqlDBModuleOptions): DynamicModule {
    return {
      module: KsqlDBModule,
      providers: [
        KsqldbService,
        {
          provide: HTTP2_INSTANCE_TOKEN,
          useValue: new ClientHttp2(config),
        },
        {
          provide: KSQLDB_MODULE_ID,
          useValue: randomStringGenerator(),
        },
      ],
      exports:[KsqldbService]
    };
  }

  public static registerAsync(options: KsqlDBModuleAsyncOptions): DynamicModule {
    return {
      module: KsqlDBModule,
      imports: options.imports,
      providers: [
        KsqldbService,
        ...this.createAsyncProviders(options),
        {
          provide: HTTP2_INSTANCE_TOKEN,
          useFactory: (config: KsqlDBModuleOptions) => new ClientHttp2(config),
          inject: [KSQLDB_MODULE_OPTIONS],
        },
        {
          provide: KSQLDB_MODULE_ID,
          useValue: randomStringGenerator(),
        },
        ...(options.extraProviders || []),
      ],
      exports:[KsqldbService]
    };
  }

  private static createAsyncProviders(
    options: KsqlDBModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: KsqlDBModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: KSQLDB_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: KSQLDB_MODULE_OPTIONS,
      useFactory: async (optionsFactory: KsqlDBModuleOptionsFactory) =>
        optionsFactory.createHttpOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}