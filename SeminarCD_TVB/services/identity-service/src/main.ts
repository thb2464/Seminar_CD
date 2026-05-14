import "./tracing";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";
import { StrapiErrorFilter } from "./common/strapi-error.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix("api", { exclude: ["health", "metrics"] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new StrapiErrorFilter());
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 3000);
  await app.listen(port);
}

void bootstrap();
