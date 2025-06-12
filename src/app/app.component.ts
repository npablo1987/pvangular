import { Component, OnInit }           from '@angular/core';
import { RouterModule }                from '@angular/router';
import { HttpClientModule }            from '@angular/common/http';
import { CommonModule }                from '@angular/common';

import { Observable, forkJoin, of }    from 'rxjs';
import { map, catchError }             from 'rxjs/operators';

import { SesionAdminService }          from './services/session/sesionadmin.service';
import { ApiserviceIndapService }      from './services/apis/apiservice-indap.service';
import { LoadingService }              from './services/serviceui/loading.service';
import { MensajeOverlayService }       from './services/serviceui/mensaje-overlay.service';
import { LoggerService }               from './services/logger/logger.service';
import { CargandoOverlayComponent }    from './shared/cargando-overlay.component';
import { MensajeOverlayComponent }     from './shared/mensaje-overlay.component';

export interface PerfilDTO {
  codigo: string;
}

@Component({
  selector   : 'app-root',
  standalone : true,
  imports    : [
    CommonModule,
    RouterModule,
    HttpClientModule,
    CargandoOverlayComponent,
    MensajeOverlayComponent
  ],
  templateUrl: './app.component.html',
  styleUrls  : ['./app.component.css']
})
export class AppComponent implements OnInit {

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
    private logger        : LoggerService,
    private msg           : MensajeOverlayService
  ) {}

  /* ────────────────────────── LIFECYCLE ─────────────────────────────── */
  ngOnInit(): void {
    this.loader.show();
    this.logger.info('[Header] Iniciando HeaderadminComponent');

    const salirConError = (msg: string, err?: any) => {
      const detail = err?.message || err?.statusText || JSON.stringify(err) || '';
      this.logger.error(`[Header] ${msg}`, err);
      const full = detail ? `${msg}: ${detail}` : msg;
      this.redirigirSinSesion(full);
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

    /* 2) Perfil o administrador --------------------------------------- */
    const rutBase = this.sessionService.getRutBase();
    this.apiService.verificarUsuariosSistema([rutBase]).pipe(
      map(arr => arr[0]?.existe === true),
      catchError(() => of(false))
    ).subscribe({
      next: esAdmin => {
        this.sessionService.storeUsuarioSistema(esAdmin);
        if (esAdmin) {
          const perfilAdmin = { codigo: 99, perfil: 'Usuario Administrador' };
          this.sessionService.setPerfilActual(perfilAdmin);
          this.procesarDatosUsuario(data);
          this.obtenerRegionAsync(payload)
            .catch(() => { /* el método ya redirige si falla */ })
            .finally(() => this.loader.hide());
          return;
        }

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
            this.obtenerRegionAsync(payload)
              .catch(() => {/* el método ya redirige si falla */})
              .finally(() => this.loader.hide());
          },
          error: err => {
            if (err?.message === 'perfil no reconocido') {
              this.redirigirSinSesion('Perfil no encontrado');
            } else {
              salirConError('error consultando perfil', err);
            }
          }
        });
      },
      error: err2 => salirConError('error verificando usuario', err2)
    });
  }

  private procesarDatosUsuario(data: any): void {
    const cap = (t: string | null | undefined) =>
      t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : null;

    const limpiar = (v: string | null | undefined) =>
      cap(this.limpiarTextoUsuario(v));

    if (data.nombre) {
      const limpio = this.limpiarTextoUsuario(data.nombre);
      this.nombreCompleto = limpio?.split(' ').map(cap).join(' ') || null;
      /* 👉 Sobrescribir en el payload para que toda la app vea el valor limpio */
      data.nombre = this.nombreCompleto;
    } else {
      this.nombres         = limpiar(data.nombres);
      this.apellidoPaterno = limpiar(data.apellido_paterno);
      this.apellidoMaterno = limpiar(data.apellido_materno);
      this.nombreCompleto  = [this.nombres, this.apellidoPaterno, this.apellidoMaterno]
        .filter(Boolean).join(' ') || null;

      // 👉 Sobrescribir campos individuales en el payload
      data.nombres          = this.nombres;
      data.apellido_paterno = this.apellidoPaterno;
      data.apellido_materno = this.apellidoMaterno;
    }

    this.rut  = data.rut  || null;
    this.nick = data.nick || null;

    // 🔄 Guardar nombre limpio en la sesión para uso global
    this.sessionService.setNombreUsuario(this.nombreCompleto ?? '');

    /* 🔄 Actualizar el payload completo dentro de la sesión,
         para que cualquier `getTokenPayload()` posterior ya venga limpio */
    const payloadActual = this.sessionService.getTokenPayload();
    if (payloadActual && payloadActual.data) {
      payloadActual.data = { ...data };          // clonar valores actualizados
      this.sessionService.setTokenPayload(payloadActual);
    }
  }

  /* ─────────── NUEVA FUNCIÓN: región como Promise<void> ─────────────── */
  private obtenerRegionAsync(payload: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {

      const token = this.sessionService.getToken();
      if (!token) {
        this.redirigirSinSesion('Sesión expirada');
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
        this.redirigirSinSesion('No se pudo determinar la región');
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

  private decodeHtml(text: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  }

  /**
   * Verifica y corrige nombres que provienen con una codificación
   * incorrecta (p. ej. tildes como "JosÃ©"). Devuelve el texto legible
   * en UTF‑8. Si no detecta fallos devuelve la cadena original.
   */
  private normalizarNombre(texto: string): string {
    if (!texto) { return texto; }

    // Si contiene caracteres típicos de una mala interpretación de UTF‑8
    const tieneErrores = /Ã|Â|¤|¸|¢|œ|¥|¨|«|®|µ/.test(texto);
    if (!tieneErrores) { return texto; }

    try {
      // reinterpreta la cadena como Latin‑1 y decodifica en UTF‑8
      // eslint-disable-next-line deprecation/deprecation
      return decodeURIComponent(escape(texto));
    } catch {
      return texto;
    }
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

  private limpiarTextoUsuario(texto: string | null | undefined): string | null {
    if (!texto) { return null; }

    // 1. Decodificar entidades HTML “normales” (&Eacute;, &ntilde;, …)
    let limpio = this.decodeHtml(texto);

    // 2. Corregir pseudo-entidades mal escritas (&EACUTE;, &OACUTE;, …)
    const accentMap: Record<string, string> = {
      'A': 'Á', 'a': 'á', 'E': 'É', 'e': 'é',
      'I': 'Í', 'i': 'í', 'O': 'Ó', 'o': 'ó',
      'U': 'Ú', 'u': 'ú', 'N': 'Ñ', 'n': 'ñ'
    };
    limpio = limpio.replace(/&([AEIOUNaeioun])ACUTE;/g, (_, letra) => accentMap[letra] || _);
    limpio = limpio.replace(/&([Nn])TILDE;/g,  (_, letra) => accentMap[letra] || _);

    // 3. Arreglar texto mal interpretado como Latin-1
    limpio = this.normalizarNombre(limpio);

    return limpio.trim();
  }


  private redirigirSinSesion(motivo = 'Acceso no autorizado'): void {
    this.sessionService.clearAll();
    this.loader.hide();

    this.msg.showCountdown(motivo, 5, () => {
      window.location.href = 'https://sistemas.indap.cl';
    });
  }

  logout(): void { this.redirigirSinSesion(); }
}
