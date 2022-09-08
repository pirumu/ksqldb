export type  KsqlServerInfo = {
  "version":string;
  "kafkaClusterId":string;
  "ksqlServiceId": string;
}

export type ServerInfoResponse = {
  KsqlServerInfo: KsqlServerInfo
}


export type HealthcheckResponse = {
  isHealthy: boolean;
  details: Record<string,any>
}
