import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { PersonaJuridica } from '../../models/persona-juridica';
import { environment } from '../../environments/environment';
import { tap, catchError, of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})

export class ApiserviceIndapService {

  private readonly baseurl: string;
  readonly apiRoot: string;
  private pjuridica!: string;
  private urlendpontregion!: string;
  private urlendponintnombreregion!: string;
  private baseurllocation!: string;
  private apiUrlLocation!: string;
  private readonly baseurldoc = environment.baseurl;
  private readonly obsRoot = `${this.baseurldoc}/observaciondoc`; // raíz del recurso

  constructor(private http: HttpClient) {



    // Ajusta protocolo (http -> https) según la página actual
    const rawUrl = environment.baseurl.replace(/\/$/, '');

    this.baseurl = rawUrl;


    this.apiRoot = this.baseurl;
    this.pjuridica = `${this.baseurl}/persona-juridica/`;
    this.urlendpontregion = `${this.baseurl}/rfpdata/consultaregionusuario`;
    this.urlendponintnombreregion = `${this.baseurl}/rfpdata/consultarnombreregion`;
    this.baseurllocation = this.baseurl;
    this.apiUrlLocation = `${this.baseurllocation}/location/`;
  }

  /** Obtiene la URL base actual (ajustada a HTTPS si corresponde). */
  getBaseUrl(): string {
    return this.baseurl;
  }


  getPerfilPorCodigo(codigo: number | string) {
    const url = `${this.baseurl.replace(/\/$/, '')}/persona-juridica/perfil/${codigo}`;
    console.log('[Perfil] consultando', url);
    return this.http.get<{codigo:number; perfil:string}>(url).pipe(
      tap(p => console.log('[Perfil] ✓ encontrado', p)),
      catchError(err => {
        console.warn('[Perfil] código', codigo, '→ 404');
        return of(null);
      })
    );
  }

  verificarUsuariosSistema(rutBases: (string | null)[]): Observable<any[]> {
    if (!rutBases?.length) {
      return of([]);
    }
    const peticiones = rutBases.map(rutBase =>
      this.http
        .get<any>(`${this.baseurl}/persona-juridica/existe/${rutBase}`)
        .pipe(
          catchError(() => of({ rut: rutBase, existe: false }))
        )
    );

    // forkJoin las ejecuta en paralelo y entrega un único array con las respuestas
    return forkJoin(peticiones);   // Observable<any[]>
  }

  uploadRegistro1986(idFicha: number, file: File) {
    const formData = new FormData();
    formData.append('archivo', file);        // mismo nombre que usa el endpoint

    const url = `${this.baseurl.replace(/\/$/, '')}/persona-juridica/registro1986/${idFicha}`;
    return this.http.post<any>(url, formData);
  }

  obtenerRegiones(): Observable<any> {
    return this.http.get<any>(`${this.apiUrlLocation}regions`);
  }

  obtenerComunasPorRegion(regionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlLocation}regions/${regionId}/comunas`);
  }


  dataFichaCompleta(id_ficha: number): Observable<any> {
    // Aquí llamamos al endpoint /ficha/completa/{id_ficha}
    return this.http.get<any>(`${this.pjuridica}completa/${id_ficha}`);
  }

  obtenerPersonasJuridicas(skip: number = 0, limit: number = 100): Observable<PersonaJuridica[]> {
    return this.http.get<PersonaJuridica[]>(`${this.pjuridica}?skip=${skip}&limit=${limit}`);
  }

  consultarPersonasPorRegion(id_region: number): Observable<PersonaJuridica[]> {
    return this.http.get<PersonaJuridica[]>(`${this.pjuridica}region/${id_region}`);
  }

  obtenerFichaDocumentos(rut: string): Observable<any> {
    return this.http.get<any>(`${this.pjuridica}${rut}/ficha-documentos`);
  }

  consultarPersonasPorEstado(estado_ficha: string): Observable<PersonaJuridica[]> {
    return this.http.get<PersonaJuridica[]>(
      `${this.pjuridica}estado/${encodeURIComponent(estado_ficha)}`
    );
  }

  consultarPersonasPorRegionYEstado(id_region: number, estado_ficha: string): Observable<PersonaJuridica[]> {
    return this.http.get<PersonaJuridica[]>(
      `${this.pjuridica}region/${id_region}/estado/${estado_ficha}`
    );
  }

  consultarNombreRegion(id_region: number, token: string): Observable<any> {
    const body = {
      id_region: id_region
    };
    const headers = {
      'Content-Type': 'application/json',
      'token': token
    };
    return this.http.post<any>(`${this.urlendponintnombreregion}`, body, { headers });
  }

  // NUEVO método para llamar a GET /region/{id_region}


  consultarRegionUsuario(id_area: number, token: string): Observable<any> {

    const body = {
      id_area: id_area
    };

    const headers = {
      'Content-Type': 'application/json',
      'token': token
    };

    return this.http.post<any>(`${this.urlendpontregion}`, body, { headers });
  }

  getObservacionesFicha(idFicha: number) {
    return this.http.get<any[]>(`${this.baseurl.replace(/\/$/, '')}/observaciondoc/ficha/${idFicha}`);
  }

  crearObservacionDoc(payload: {
    id_ficha: number;
    id_documento: number;
    observacion?: string;
    fecha_vigencia?: string;
    id_usuario_modificacion: number;
  }): Observable<any> {
    const url = `${this.obsRoot}/`;                          // ← barra final
    console.log('[crearObservacionDoc] URL:', url);
    return this.http.post<any>(url, payload).pipe(
      tap(res => console.log('[crearObservacionDoc] ✔︎', res)),
      catchError(err => { console.error('[crearObservacionDoc] ✖︎', err); throw err; })
    );
  }

  /** Actualizar observación: PUT https://…/observaciondoc/{id}  */
  actualizarObservacionDoc(
    id_observacion: number,
    payload: {
      observacion?: string;
      fecha_vigencia?: string;
      id_usuario_modificacion: number;
    }
  ): Observable<any> {
    const url = `${this.obsRoot}/${id_observacion}`;        // ← sin replace(), sin barra final extra
    console.log('[actualizarObservacionDoc] URL:', url);
    return this.http.put<any>(url, payload).pipe(
      tap(res => console.log('[actualizarObservacionDoc] ✔︎', res)),
      catchError(err => { console.error('[actualizarObservacionDoc] ✖︎', err); throw err; })
    );
  }

  cambiarEstadoFicha(
    idFicha: number,
    idUsuario: number,
    observaciones: string,
    nuevoEstado: 'aprobado' | 'rechazado'
  ) {
    const body = {
      id_usuario:    idUsuario,
      observaciones: observaciones,
      nuevo_estado:  nuevoEstado
    };
    return this.http.put<{ message: string; estado: string }>(
      `${this.baseurl.replace(/\/$/, '')}/ficha/${idFicha}/estado`,
      body
    );
  }

  downloadCertificado(idFicha: number) {
    const url = `${this.baseurl.replace(/\/$/, '')}/certificados/${idFicha}`;
    // ⬇️  Indicamos 'blob' para recibir el binario
    return this.http.get(url, { responseType: 'blob' });
  }

  getCertificadoRFPmeta(idFicha: number) {
    const url = `${this.baseurl.replace(/\/$/, '')}/persona-juridica/certificado-rfp/${idFicha}`;
    return this.http.get<any>(url);
  }

  downloadCertificadoRFP(idFicha: number) {
    const url = `${this.apiRoot}/persona-juridica/certificado-rfp/${idFicha}?download=1`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /** Obtiene los movimientos del usuario identificado por su rut base */
  obtenerMovimientosPorRut(rutBase: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.pjuridica}movimientos/${rutBase}`);
  }

  uploadCertificadoRFP(
    idFicha: number,
    file: File,
    nroResolucion: string,
    fechaResolucionISO: string,   // 'YYYY-MM-DD'
    idUsuario: number
  ) {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('nro_resolucion',   nroResolucion);
    formData.append('fecha_resolucion', fechaResolucionISO);
    formData.append('id_usuario', String(idUsuario));

    const url = `${this.baseurl.replace(/\/$/, '')}/persona-juridica/certificado-rfp/${idFicha}`;
    return this.http.post<any>(url, formData);
  }

}
