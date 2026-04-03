import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS so the React frontend can consume REST and SSE on a different port
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend is running on: http://localhost:${port}`);
}

bootstrap();
