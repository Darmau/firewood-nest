import {NestFactory} from "@nestjs/core";
import {AppModule} from "@/app.module";

const port = process.env.PORT || 1994;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
