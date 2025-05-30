

import { Component, OnInit }           from '@angular/core';
import { RouterModule }                from '@angular/router';
import { HttpClientModule }            from '@angular/common/http';
import { CommonModule }                from '@angular/common';

import { forkJoin }                    from 'rxjs';
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

  // ─── DEBUG ───────────────────────────────────────────────────────────────
  public errorMessage: string | null = null;

  // ─── Datos de usuario (header) ───────────────────────────────────────────
  nombreCompleto   : string | null = null;
  nombres          : string | null = null;
  apellidoPaterno  : string | null = null;
  apellidoMaterno  : string | null = null;
  rut              : string | null = null;
  nick             : string | null = null;

  // ─── Datos de región ─────────────────────────────────────────────────────
  nombreRegion = '';
  // Flag para que otros componentes sepan que la región está disponible
  regionReady  = false;

  constructor(
    private sessionService: SesionAdminService,
    private apiService    : ApiserviceIndapService,
    public  loader        : LoadingService,         // <- público por si template lo usa
    private logger        : LoggerService
  ) {}

  /* ───────────────────────── LIFECYCLE ──────────────────────────────────── */
  ngOnInit(): void {
    this.loader.show();
    this.logger.info('[Header] Iniciando HeaderadminComponent');

    /* Utilitario local para capturar error y permanecer en la vista */
    const salirConError = (msg: string, err?: any) => {
      const detail = err?.message || err?.statusText || JSON.stringify(err) || '';
      this.logger.error(`[Header] ${msg}`, err);
      this.errorMessage = detail ? `${msg}: ${detail}` : msg;
      this.loader.hide();
    };

    /* ─── 0) Procesar ?token= que viene por querystring ─────────────────── */
    const url      = new URL(window.location.href);
    const urlToken = url.searchParams.get('token');

    if (urlToken) {
      if (!this.procesarTokenSeguro(urlToken)) {
        return salirConError('token inválido');
      }
      // limpia la URL para evitar exponer el JWT
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname + url.search);
    } else if (!this.sessionService.hasValidToken()) {
      return salirConError('sesión expirada');
    }

    /* ─── 1) Cargar datos generales de sesión ───────────────────────────── */
    const payload = this.sessionService.getTokenPayload();
    const data    = payload?.data as any;
    this.logger.info('[Header] Payload actual:', payload);

    if (!data) {
      return salirConError('payload vacío');
    }

    /* ─── 2) Resolver perfil 108 / 109 ──────────────────────────────────── */
    const codigosValidos = (data.perfilActual as string[] || [])
      .filter(c => c === '108' || c === '109');

    if (codigosValidos.length === 0) {
      return salirConError('sin perfil autorizado');
    }

    /* Peticiones paralelas para encontrar el primer perfil válido */
    const peticiones$ = codigosValidos.map(c => this.apiService.getPerfilPorCodigo(c));

    forkJoin(peticiones$)
      .pipe(map(arr => arr.find(p => p !== null) ?? null))
      .subscribe({
        next : perfil => {
          if (!perfil) { return salirConError('perfil no reconocido'); }
          this.sessionService.setPerfilActual(perfil);
          this.procesarDatosUsuario(data);
          this.obtenerRegion(payload);          // 🔑 cuando termine, esconderá el loader
        },
        error: err => salirConError('error consultando perfil', err)
      });
  }

  /* ────────────────────── DATOS DE USUARIO ─────────────────────────────── */
  private procesarDatosUsuario(data: any): void {
    const cap = (t: string|null|undefined) =>
      t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : null;

    if (data.nombre) {
      this.nombreCompleto = data.nombre
        .split(' ')
        .map(cap)
        .join(' ')
        .trim();
    } else {
      this.nombres         = cap(data.nombres);
      this.apellidoPaterno = cap(data.apellido_paterno);
      this.apellidoMaterno = cap(data.apellido_materno);
      this.nombreCompleto  = [this.nombres, this.apellidoPaterno, this.apellidoMaterno]
        .filter(Boolean)
        .join(' ') || null;
    }
    this.rut  = data.rut  || null;
    this.nick = data.nick || null;
  }

  /* ────────────────────── REGIÓN (sin personas) ────────────────────────── */
  private obtenerRegion(payload: any): void {
    const token = this.sessionService.getToken();
    if (!token) {
      this.logger.error('[Header] No se encontró token para consultas API');
      return this.redirigirSinSesion();
    }

    const regionId   = this.sessionService.getRegionId();
    const regionName = this.sessionService.getRegionName();

    // A) Ya existe → listo.
    if (regionId && regionName) {
      this.setRegionAndFinish(regionId, regionName);
      return;
    }

    // B) Derivar desde payload (solo la primera vez)
    const data   = payload.data as any;
    const ambito = data.ambitoActivo;
    const macro  = Number(data.macroZonaActiva);

    if (ambito === '2') {
      this.procesarRegionDirecta(macro, token);
    } else if (ambito === '4') {
      this.procesarRegionDesdeArea(macro, token);
    } else {
      this.logger.warn('[Header] Ámbito no manejado:', ambito);
      this.redirigirSinSesion();
    }
  }

  /* Ámbito 2: macro = región directamente */
  private procesarRegionDirecta(regionId: number, token: string): void {
    this.apiService.consultarNombreRegion(regionId, token).subscribe({
      next : r => this.setRegionAndFinish(regionId, r.region_nombre),
      error: e => { this.logger.error(e); this.redirigirSinSesion(); }
    });
  }

  /* Ámbito 4: obtener región a partir del Área */
  private procesarRegionDesdeArea(areaId: number, token: string): void {
    this.apiService.consultarRegionUsuario(areaId, token).subscribe({
      next : resp => {
        const regionId = Number(resp.id_region);
        this.apiService.consultarNombreRegion(regionId, token).subscribe({
          next : rNom => this.setRegionAndFinish(regionId, rNom),
          error: e => { this.logger.error(e); this.redirigirSinSesion(); }
        });
      },
      error: e => { this.logger.error(e); this.redirigirSinSesion(); }
    });
  }

  private setRegionAndFinish(id: number, nombreBruto: string): void {
    const nombre = this.capitalizar(typeof nombreBruto === 'string' ? nombreBruto : (nombreBruto as any).region_nombre);
    this.nombreRegion = nombre;
    this.sessionService.storeRegionData(id, nombre);
    this.regionReady = true;          // ← los demás componentes ya pueden usar el ID
    this.loader.hide();               // 🔚 listo, oculto la pantalla de carga
    this.logger.info(`[Header] Región resuelta: #${id} - ${nombre}`);
  }

  private capitalizar(txt: string): string {
    return txt ? txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase() : '';
  }

  /* ────────────────────── SESIÓN / LOGOUT ──────────────────────────────── */
  private procesarTokenSeguro(jwt: string): boolean {
    try {
      const [, payloadB64] = jwt.split('.');
      const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
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

  private redirigirSinSesion(): void {
    this.sessionService.clearAll();
    this.loader.hide();
    window.location.href = 'https://sistemas.indap.cl';
  }

  logout(): void {
    this.redirigirSinSesion();
  }
}
