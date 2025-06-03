/* ────────────────────────────────────────────────────────────────
 * SesionAdminService – gestión de JWT, payload y datos de región
 * (versión independiente para el portal de administración)
 * Usa localStorage para que la sesión persista entre recargas
 * mientras el token no haya expirado.
 * ──────────────────────────────────────────────────────────────── */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SesionAdminService {

  /* Claves en localStorage */
  private readonly TOKEN_KEY       = 'adminJwtToken';
  private readonly PAYLOAD_KEY     = 'adminTokenPayload';
  private readonly EXPIRES_AT_KEY  = 'adminTokenExpiresAt';
  private readonly REGION_ID_KEY   = 'adminRegionId';
  private readonly REGION_NAME_KEY = 'adminRegionName';
  private perfilActual: { codigo: number; perfil: string } | null = null;

  // Stream interno que avisará cada vez que cambie la región
  private regionSubject = new BehaviorSubject<{ regionId: number; regionName: string } | null>(null);

// Observable público para que otros componentes puedan suscribirse
  public  region$       = this.regionSubject.asObservable();

  /* helpers genéricos */
  private set(key: string, value: string)  { localStorage.setItem(key, value); }
  private get(key: string): string | null  { return localStorage.getItem(key); }
  private del(key: string)                 { localStorage.removeItem(key);    }

  initFromUrl(): boolean {
    const currentUrl = new URL(window.location.href);
    const urlToken   = currentUrl.searchParams.get('token');
    if (!urlToken) { return false; }

    try {
      const [, payloadB64] = urlToken.split('.');
      const json     = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload  = JSON.parse(json);

      /* ▶ valida payload */
      if (!payload || typeof payload !== 'object' || !payload.exp) {
        throw new Error('payload sin exp o estructura');
      }

      this.storeToken(urlToken, payload.exp);
      this.setTokenPayload(payload);

      /* limpia ?token= de la URL */
      currentUrl.searchParams.delete('token');
      window.history.replaceState({}, '',
        currentUrl.pathname + currentUrl.search);

      return true;
    } catch (e) {
      console.error('[SessionService] Token inválido:', e);
      this.clearAll();
      return false;
    }
  }


  setPerfilActual(p: any): void {
    this.perfilActual = p;
  }

  getPerfilActual() {
    return this.perfilActual;
  }

  getRegionId(): number | null {
    const raw = this.get(this.REGION_ID_KEY);
    return raw ? Number(raw) : null;
  }

  getRegionName(): string | null {
    return this.get(this.REGION_NAME_KEY);
  }

  /** Guarda el token y (opcional) su expiración en segundos UNIX */
  storeToken(token: string, expSegUnix: number | null): void {
    this.set(this.TOKEN_KEY, token);
    if (expSegUnix) { this.set(this.EXPIRES_AT_KEY, expSegUnix.toString()); }
  }

  getToken(): string | null { return this.get(this.TOKEN_KEY); }

  hasValidToken(): boolean {
    const token  = this.getToken();
    const expStr = this.get(this.EXPIRES_AT_KEY);
    if (!token || !expStr) { return false; }
    return parseInt(expStr, 10) * 1000 > Date.now();
  }

  clearToken(): void {
    this.del(this.TOKEN_KEY);
    this.del(this.EXPIRES_AT_KEY);
  }

  /* ───────── Payload (datos usuario) ───────── */

  setTokenPayload(payload: any): void {
    this.set(this.PAYLOAD_KEY, JSON.stringify(payload));
  }

  getTokenPayload(): any {
    const raw = this.get(this.PAYLOAD_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  clearTokenPayload(): void { this.del(this.PAYLOAD_KEY); }

  /* ───────── Datos de región ───────── */

  storeRegionData(regionId: number, regionName: string): void {
    this.set(this.REGION_ID_KEY,   regionId.toString());
    this.set(this.REGION_NAME_KEY, regionName);

    // 📣 notifica a quien esté escuchando
    this.regionSubject.next({ regionId, regionName });
  }

  getRegionData(): { regionId: number; regionName: string } {
    return {
      regionId  : parseInt(this.get(this.REGION_ID_KEY) || '0', 10),
      regionName: this.get(this.REGION_NAME_KEY) || ''
    };
  }

  clearRegionData(): void {
    this.del(this.REGION_ID_KEY);
    this.del(this.REGION_NAME_KEY);

    // 📣 deja el observable en estado “sin región”
    this.regionSubject.next(null);
  }
  /** Devuelve el objeto `data` del payload JWT (o `null` si no existe) */
  getUserData(): any | null {
    const payload = this.getTokenPayload();
    return payload && payload.data ? payload.data : null;
  }

  /** RUT completo con dígito verificador, p. ej. 16650344-2 */
  getRut(): string | null {
    const user = this.getUserData();
    return user ? user.rut || null : null;
  }

  /** RUT **sin** dígito verificador, sólo números */
  getRutBase(): string | null {
    const rut = this.getRut();
    return rut ? rut.replace(/\./g, '').replace('-', '').slice(0, -1) : null;
  }

  /* ───────── Limpieza total ───────── */

  clearAll(): void {
    this.clearToken();
    this.clearTokenPayload();
    this.clearRegionData();
  }


}
