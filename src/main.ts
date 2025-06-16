import { bootstrapApplication } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './app/environments/environment';

if (environment.production) {
  enableProdMode();
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
} else {
  console.log(`[BOOT] Starting application in ${environment.envName} mode`);
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
