export class QueryParser {
  public  headers: Record<string, any>;

  parse(res: any[]) {
    const { columnNames } = this.headers;
    let row = {};

    res.forEach((value,index) => {
      row[columnNames[index]] = value;
    });

    return row;
  }
}
