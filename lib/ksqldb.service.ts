import { filter, map } from 'rxjs';
import { StreamParser } from './parser';
import { ClientHttp2 } from './http2/client.http2';
import {  RequestParam } from './http2/type/client-http2.type';
import {  HealthcheckResponse, ServerInfoResponse } from './response';
import { EndPoint, HTTP2_INSTANCE_TOKEN, SQL } from './ksqldb.constants';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class KsqldbService implements OnModuleInit, OnModuleDestroy {
  public constructor(@Inject(HTTP2_INSTANCE_TOKEN) private readonly http2Client: ClientHttp2) {
  }

  public async onModuleInit(): Promise<void> {
    await this.http2Client.startSession();
  }

  public onModuleDestroy(): any {
    this.http2Client.endSession();
  }

  public async willConnect() {
    if (!this.http2Client.isConnected) {
      await this.http2Client.startSession();
    }
  }

  public execute(statement: string, path: string, params?: RequestParam) {
    let body = {};
    if (params) {
      body = {
        ...params,
      };
    }
    if (statement) {
      body = {
        ...body,
        ksql: statement,
      };
    }
    const buffer = Buffer.from(JSON.stringify(body));
    return this.http2Client.request(path, buffer);
  }

  public pullQuery<T>(query: string, params?: RequestParam) {
    if(query.includes('EMIT CHANGES;')) {
      throw new Error('Remove EMIT CHANGES; in query')
    }
    let body = {};
    if (params) {
      body = {
        ...params,
      };
    }
    body = {
      ...body,
      sql: query,
    };
    const buffer = Buffer.from(JSON.stringify(body));
    // const queryParser = new QueryParser();
    // queryParser.parse(res)
    return this.http2Client.request<Array<T>>(EndPoint.QUERY_STREAM, buffer,'application/vnd.ksqlapi.delimited.v1');
  }

  public pushQuery<T>(query: string, params?: RequestParam) {
    if(!query.includes('EMIT CHANGES;')) {
      throw new Error('Missing EMIT CHANGES; in query')
    }
    return this.streamQuery(query,params);
  }

  public streamQuery<T>(query: string, params?: RequestParam) {
    let body = {};
    if (params) {
      body = {
        ...params,
      };
    }
    body = {
      ...body,
      sql: query,
    };
    const buffer = Buffer.from(JSON.stringify(body))
    const streamParser = new StreamParser();
    return this.http2Client.streamRequest<T>(
      EndPoint.QUERY_STREAM,
      buffer,
      'application/vnd.ksqlapi.delimited.v1',
    ).pipe(map(res => streamParser.parse(res))).pipe(filter(res => res.state !==  StreamParser.FETCH_METADATA));
  }

  public terminatePushQuery(queryId: string) {
    return this.execute(undefined, EndPoint.CLOSE_QUERY, { queryId });
  }

  public getStreams() {
    return this.execute(SQL.LIST_STREAM, EndPoint.KSQL);

  }

  public getTables() {
    return this.execute(SQL.LIST_TABLE, EndPoint.KSQL);
  }

  public getTopics() {
    return this.execute(SQL.LIST_TOPIC, EndPoint.KSQL);
  }

  public getQueries() {
    return this.execute(SQL.LIST_QUERY, EndPoint.KSQL);
  }

  public describe(sourceName: string) {
    return this.execute(`DESCRIBE ${sourceName}; `, EndPoint.KSQL);
  }

  public getServerInfo() {
    return this.http2Client.request<ServerInfoResponse>(EndPoint.INFO, null);
  }

  public healthcheck() {
    return this.http2Client.request<HealthcheckResponse>(EndPoint.HEALTH_CHECK, null);
  }

  public getQueryStatus(queryId: string) {

  }

  public terminate() {
  }

  public isValidProperty() {
  }
}