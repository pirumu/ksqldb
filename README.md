# KsqlDB Client for Nestjs ![logo](https://docs.ksqldb.io/en/latest/img/logo.png)

## Install

```
# npm
npm install @nattogo/ksqldb
# yarn
yarn add @nattogo/ksqldb
```

## Usage
```ts
// app.module.ts
import { KsqlDBModule } from '@nattogo/ksqldb';

@Module({
  imports: [
    KsqlDBModule.register({
      url: 'http://localhost:8088',
      timeout: 3000,
    }),
  ],
})
export class AppModule {}
```

```ts
//app.service.ts
import { KsqldbService } from '@nattogo/ksqldb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly ksqldbService: KsqldbService) {
  }

   pushQuery() {
    this.ksqldbService.pushQuery('SELECT * FROM STREAM EMIT CHANGES;').subscribe({
      next: (data) => console.log(data),
    });
  }
}

```