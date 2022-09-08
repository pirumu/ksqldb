import { Http2Response } from '../http2/type/client-http2.type';

export class StreamParser {
  public static FETCH_METADATA= 'fetch-metadata';
  public  headers: Record<string, any>;

  public  parse(res: Http2Response) {
    if (res.status === 200) {
      if (!this.headers) {
        this.headers = res.data
        res.state = StreamParser.FETCH_METADATA;
      } else if (res.data) {
        res.headers = this.headers;
        res.data = this.mapDataToFields(res.data)
      }
    }
    return res;
  }

  private  mapDataToFields(rawData) {
    const record = {};
    const { columnNames } = this.headers;
    if (Array.isArray(rawData)) {
      rawData.forEach((value, i) => (record[columnNames[i]] = value));
    }
    return record;
  }

}