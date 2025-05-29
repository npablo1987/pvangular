// src/app/admincomponent/headeradmin/headeradmin.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { forkJoin } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { SesionAdminService } from './services/session/sesionadmin.service';
import { ApiserviceIndapService } from './services/apis/apiservice-indap.service';
import { LoadingService } from './services/serviceui/loading.service';
import { LoggerService } from './services/logger/logger.service';
import { CargandoOverlayComponent } from './shared/cargando-overlay.component';

export interface PerfilDTO {
  codigo: string;
}

@Component({
  selector   : 'app-root',
  standalone : true,
  imports    : [RouterModule, HttpClientModule, CargandoOverlayComponent],
  templateUrl: './app.component.html',
  styleUrls  : ['./app.component.css']
})
export class AppComponent implements OnInit {

  // ─── MODO DEBUG ───────────────────────────────────────
  public errorMessage: string | null = null;

  // ─── Variables para el template ───────────────────────
  nombreCompleto: string | null = null;
  nombres: string | null = null;
  apellidoPaterno: string | null = null;
  apellidoMaterno: string | null = null;
  rut: string | null = null;
  nick: string | null = null;

  constructor(
    private sessionService: SesionAdminService,
    private apiService: ApiserviceIndapService,
    private loader: LoadingService,
    private logger: LoggerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loader.show();
    this.logger.info('[Header] Iniciando HeaderadminComponent');

    // utilitario para capturar y mostrar error sin redirigir
    const salirConError = (msg: string, err?: any) => {
      // extraigo un detalle legible del error
      const detail =
        err?.message
        || err?.statusText
        || JSON.stringify(err)
        || '';
      // log completo al console/backend
      this.logger.error(`[Header] ${msg}`, err);
      // asigno a la variable que muestra la alerta en pantalla
      this.errorMessage = detail
        ? `${msg}: ${detail}`
        : msg;
      this.loader.hide();
      // ya no redirijo aquí; así ves el mensaje
    };

    // ─── 0) Procesar ?token= ──────────────────────────────
    const url      = new URL(window.location.href);
    const urlToken = url.searchParams.get('token');

    if (urlToken) {
      if (!this.procesarTokenSeguro(urlToken)) {
        return salirConError('token inválido');
      }
      // limpia la URL y sigue
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname + url.search);

    } else if (!this.sessionService.hasValidToken()) {
      return salirConError('sesión expirada');
    }

    // ─── 1) Cargar datos de la sesión ─────────────────────
    const payload = this.sessionService.getTokenPayload();
    const data    = payload?.data;
    this.logger.info('[Header] Payload actual:', payload);

    if (!data) {
      return salirConError('payload vacío');
    }

    // ─── 2) Resolver perfil 108 / 109 ─────────────────────
    const codigosValidos = (data.perfilActual as string[] || [])
      .filter(c => c === '108' || c === '109');
    this.logger.info('[Header] Códigos válidos:', codigosValidos);

    if (codigosValidos.length === 0) {
      return salirConError('sin perfil autorizado');
    }

    const peticiones$ = codigosValidos
      .map(c => this.apiService.getPerfilPorCodigo(c));

    forkJoin(peticiones$)
      .pipe(
        map(arr => arr.find(p => p !== null) ?? null),
        finalize(() => this.loader.hide())
      )
      .subscribe(
        perfil => {
          if (!perfil) {
            return salirConError('perfil no reconocido');
          }
          this.sessionService.setPerfilActual(perfil);
          // ─── resto de tu lógica de éxito ─────────────────
          const cap = (t: string|null|undefined) =>
            t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : null;

          if (data.nombre) {
            this.nombreCompleto = data.nombre
              .split(' ')
              .map(cap)
              .join(' ')
              .trim();
          } else {
            this.nombres         = cap((data as any).nombres);
            this.apellidoPaterno = cap((data as any).apellido_paterno);
            this.apellidoMaterno = cap((data as any).apellido_materno);
            this.nombreCompleto  = [
                this.nombres,
                this.apellidoPaterno,
                this.apellidoMaterno
              ]
                .filter(Boolean)
                .join(' ')
              || null;
          }
          this.rut  = data.rut  || null;
          this.nick = data.nick || null;
          this.logger.info(`[Header] Usuario: ${this.nombreCompleto} (${this.rut})`);
        },
        err => salirConError('error consultando perfil', err)
      );
  }

  private procesarTokenSeguro(jwt: string): boolean {
    try {
      const [, payloadB64] = jwt.split('.');
      const json = atob(
        payloadB64.replace(/-/g, '+').replace(/_/g, '/')
      );
      const payload = JSON.parse(json);

      if (!payload || typeof payload !== 'object' || !payload.exp) {
        throw new Error('payload sin estructura válida');
      }

      this.sessionService.storeToken(jwt, payload.exp);
      this.sessionService.setTokenPayload(payload);
      return true;
    } catch (e) {
      this.logger.error('[Header] JWT inválido:', e);
      this.sessionService.clearAll();
      return false;
    }
  }

  private redirigirSinPerfil(): void {
    this.logger.warn('Sin perfil válido ➞ redirección');
    this.sessionService.clearAll();
    window.location.href = 'https://sistemas.indap.cl';
  }

  logout(): void {
    this.sessionService.clearAll();
    window.location.href = 'https://sistemas.indap.cl';
  }
}
