export const KSQLDB_MODULE_ID = 'KSQLDB_MODULE_ID';
export const HTTP2_INSTANCE_TOKEN = 'HTTP2_INSTANCE_TOKEN';
export const KSQLDB_MODULE_OPTIONS = 'KSQLDB_MODULE_OPTIONS';


export enum EndPoint {
  KSQL = '/ksql',
  INFO = '/info',
  STATUS = '/status',
  QUERY = '/query',
  CLOSE_QUERY = '/close-query',
  HEALTH_CHECK = '/healthcheck',
  QUERY_STREAM = '/query-stream',
  CLUSTER_STATUS = '/clusterstatus',
  INSERTS_STREAM = '/inserts-stream',
  KSQL_TERMINATE = '/ksql/terminate',
  IS_VALID_PROPERTY = '/is_valid_property',
}

export enum SQL {
  LIST_TABLE = 'LIST TABLES;',
  LIST_TOPIC = 'LIST TOPICS;',
  LIST_QUERY = 'LIST QUERIES;',
  LIST_STREAM = 'LIST STREAMS;',
}

export enum Http2Header {
  KSQL_V1_JSON = 'application/vnd.ksql.v1+json',
}
