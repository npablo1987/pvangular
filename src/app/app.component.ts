import { Component, OnInit }           from '@angular/core';
import { RouterModule }                from '@angular/router';
import { HttpClientModule }            from '@angular/common/http';
import { CommonModule }                from '@angular/common';

import { Observable, forkJoin }        from 'rxjs';
import { map }                         from 'rxjs/operators';

import { SesionAdminService }          from './services/session/sesionadmin.service';
import { ApiserviceIndapService }      from './services/apis/apiservice-indap.service';
import { LoadingService }              from './services/serviceui/loading.service';
import { LoggerService }               from './services/logger/logger.service';
import { CargandoOverlayComponent }    from './shared/cargando-overlay.component';

export interface PerfilDTO {
  codigo: string;
}

@Component({
  selector   : 'app-root',
  standalone : true,
  imports    : [CommonModule, RouterModule, HttpClientModule, CargandoOverlayComponent],
  templateUrl: './app.component.html',
  styleUrls  : ['./app.component.css']
})
export class AppComponent implements OnInit {

  /* ─── DEBUG ────────────────────────────────────────────────────────── */
  public errorMessage: string | null = null;

  /* ─── Datos de usuario (header) ────────────────────────────────────── */
  nombreCompleto   : string | null = null;
  nombres          : string | null = null;
  apellidoPaterno  : string | null = null;
  apellidoMaterno  : string | null = null;
  rut              : string | null = null;
  nick             : string | null = null;

  /* ─── Datos de región ─────────────────────────────────────────────── */
  nombreRegion = '';
  regionReady  = false;

  constructor(
    private sessionService: SesionAdminService,
    private apiService    : ApiserviceIndapService,
    public  loader        : LoadingService,
    private logger        : LoggerService
  ) {}

  /* ────────────────────────── LIFECYCLE ─────────────────────────────── */
  ngOnInit(): void {
    this.loader.show();
    this.logger.info('[Header] Iniciando HeaderadminComponent');

    const salirConError = (msg: string, err?: any) => {
      const detail = err?.message || err?.statusText || JSON.stringify(err) || '';
      this.logger.error(`[Header] ${msg}`, err);
      this.errorMessage = detail ? `${msg}: ${detail}` : msg;

    };

    /* 0) ?token= -------------------------------------------------------- */
    const url      = new URL(window.location.href);
    const urlToken = url.searchParams.get('token');

    if (urlToken) {
      if (!this.procesarTokenSeguro(urlToken)) {
        return salirConError('token inválido');
      }
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname + url.search);
    } else if (!this.sessionService.hasValidToken()) {
      return salirConError('sesión expirada');
    }

    /* 1) Payload -------------------------------------------------------- */
    const payload = this.sessionService.getTokenPayload();
    const data    = payload?.data as any;
    this.logger.info('[Header] Payload actual:', payload);

    if (!data) {
      return salirConError('payload vacío');
    }

    /* 2) Perfiles ------------------------------------------------------- */
    const codigosPerfil = Array.isArray(data.perfilActual)
      ? data.perfilActual
      : [data.perfilActual];

    if (!codigosPerfil.length) {
      return salirConError('usuario sin perfiles');
    }

    forkJoin<({codigo: number; perfil: string} | null)[]>(
      codigosPerfil.map((c: string | number) => this.apiService.getPerfilPorCodigo(c))
    ).pipe(
      map(perfiles => {
        const perfilValido = perfiles.find(
          (p): p is {codigo: number; perfil: string} => !!(p && p.perfil)
        );
        if (!perfilValido) { throw new Error('perfil no reconocido'); }
        return perfilValido;
      })
    ).subscribe({
      next: perfilValido => {
        this.sessionService.setPerfilActual(perfilValido);
        this.procesarDatosUsuario(data);

        /* — NUEVO paso secuencial — */
        this.obtenerRegionAsync(payload)
          .catch(() => {/* el método ya redirige si falla */});
      },
      error: err => salirConError('error consultando perfil', err)
    });
  }

  /* ──────────────────── DATOS DE USUARIO ────────────────────────────── */
  private procesarDatosUsuario(data: any): void {
    const cap = (t: string|null|undefined) =>
      t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : null;

    if (data.nombre) {
      this.nombreCompleto = data.nombre.split(' ').map(cap).join(' ').trim();
    } else {
      this.nombres         = cap(data.nombres);
      this.apellidoPaterno = cap(data.apellido_paterno);
      this.apellidoMaterno = cap(data.apellido_materno);
      this.nombreCompleto  = [this.nombres, this.apellidoPaterno, this.apellidoMaterno]
        .filter(Boolean).join(' ') || null;
    }
    this.rut  = data.rut  || null;
    this.nick = data.nick || null;
  }

  /* ─────────── NUEVA FUNCIÓN: región como Promise<void> ─────────────── */
  private obtenerRegionAsync(payload: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {

      const token = this.sessionService.getToken();
      if (!token) {
        this.redirigirSinSesion();
        return reject();
      }

      const regId  = this.sessionService.getRegionId();
      const regNom = this.sessionService.getRegionName();

      const ok = (id: number, nom: string) => {
        this.setRegionAndFinish(id, nom);
        resolve();
      };
      const ko = (e?: any) => {
        this.logger.error(e);
        this.redirigirSinSesion();
        reject(e);
      };

      /* A) Ya tenemos región en sesión --------------------------------- */
      if (regId && regNom) { return ok(regId, regNom); }

      /* B) Derivar desde payload --------------------------------------- */
      const data   = payload.data as any;
      const ambito = data.ambitoActivo;
      const macro  = Number(data.macroZonaActiva);

      if (ambito === '2') {               /* región directa */
        this.apiService.consultarNombreRegion(macro, token)
          .subscribe({ next: r => ok(macro, r.region_nombre), error: ko });

      } else if (ambito === '4') {        /* región vía área */
        this.apiService.consultarRegionUsuario(macro, token).subscribe({
          next: resp => {
            const idReg = Number(resp.id_region);
            this.apiService.consultarNombreRegion(idReg, token)
              .subscribe({ next: r => ok(idReg, r.region_nombre), error: ko });
          },
          error: ko
        });

      } else {
        this.logger.warn('[Header] Ámbito no manejado:', ambito);
        ko();
      }
    });
  }

  /* ───────────── REGIÓN (lógica original, sin cambios) ──────────────── */
  private obtenerRegion(payload: any): void { /* … intacto … */ }

  private procesarRegionDirecta(regionId: number, token: string): void { /* … */ }
  private procesarRegionDesdeArea(areaId: number, token: string): void { /* … */ }

  private setRegionAndFinish(id: number, nombreBruto: string): void {
    const nombre = this.capitalizar(
      typeof nombreBruto === 'string' ? nombreBruto : (nombreBruto as any).region_nombre
    );
    this.nombreRegion = nombre;
    this.sessionService.storeRegionData(id, nombre);
    this.regionReady = true;
    this.logger.info(`[Header] Región resuelta: #${id} - ${nombre}`);
  }

  private capitalizar(txt: string): string {
    return txt ? txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase() : '';
  }

  /* ─────────────────── Sesión / JWT helpers (igual) ────────────────── */
  private procesarTokenSeguro(jwt: string): boolean {
    try {
      const [, payloadB64] = jwt.split('.');
      const json     = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload  = JSON.parse(json);

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

  private redirigirSinSesion(): void {
    this.sessionService.clearAll();
    this.loader.hide();
    window.location.href = 'https://sistemas.indap.cl';
  }

  logout(): void { this.redirigirSinSesion(); }
}
