import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MenuadminComponent} from '../menuadmin/menuadmin.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { inject } from '@angular/core';

import {FichaselecionadaService} from '../../services/session/fichaselecionada.service';
import {ApiserviceIndapService} from '../../services/apis/apiservice-indap.service';
import {SesionAdminService} from '../../services/session/sesionadmin.service';
import { MensajeOverlayService } from '../../services/serviceui/mensaje-overlay.service';
import {saveAs} from 'file-saver';

interface DocTabla {
  id_documento: number;
  nombre: string;
  categoria?: string;
  ruta_ftp?: string;
  id_observacion_doc?: number;
  observacion?: string;
  fecha_vigencia?: string;
  edit?: boolean;
}

@Component({
  selector: 'app-revisionficha',
  standalone : true,
  imports    : [
    CommonModule,
    MenuadminComponent,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './revisionficha.component.html',
  styleUrl: './revisionficha.component.css'
})
export class RevisionfichaComponent implements OnInit {
  private session = inject(SesionAdminService);
  private baseUrl = '';
  documentos: DocTabla[] = [];
  historial: any[] = [];
  observacionDecision: string = '';
  selectedFile!: File;
  subiendo   = false;
  mensaje    = '';
  mostrarAcciones = true;
  puedeDescargar = false;
  esAdmin = false;
  observacionFinal = '';
  idUsuario!: number;                     // ← ahora será el RUT sin DV
  registro1986Cargado = false;

  private idFicha!: number;

  constructor(
    private fichaSrv : FichaselecionadaService,
    private api      : ApiserviceIndapService,
    private msg      : MensajeOverlayService
  ) {

    console.log('[Revisionficha] constructor → session =', this.session);
  }

  /**
   * Carga datos de la ficha completa en las variables locales.
   * Se reutiliza tanto al iniciar el componente como al refrescar.
   */
  private loadFichaFromData(fichaCompleta: any) {
    this.historial = fichaCompleta.historial ?? [];
    this.idFicha   = fichaCompleta.ficha?.id_ficha;

    this.documentos = (fichaCompleta.documentos || []).map((d: any) => ({
      id_documento: d.id_documento,
      nombre      : d.nombre,
      categoria   : d.categoria,
      ruta_ftp    : d.ruta_ftp
    }));

    this.registro1986Cargado = this.documentos.some(
      (d) => d.categoria === 'registro1986'
    );

    this.api.getObservacionesFicha(this.idFicha).subscribe((obs) => {
      for (const doc of this.documentos) {
        const encontrado = obs.find((o: any) => o.id_documento === doc.id_documento);
        if (encontrado) {
          Object.assign(doc, {
            id_observacion_doc: encontrado.id_observacion_doc,
            observacion       : encontrado.observacion,
            fecha_vigencia    : encontrado.fecha_vigencia,
          });
        }
      }
    });

    const perfilObj   = this.session.getPerfilActual();   // { codigo, perfil }
    const perfilTxt   = perfilObj?.perfil || '';
    const estadoBuscado = `aprobado - ${perfilTxt}`;
    const buscadoNorm = this.normalizar(estadoBuscado);

    const estadoFicha   = this.normalizar(fichaCompleta.ficha?.estado);
    const halladoEnHist = this.historial.some(h =>
      this.normalizar(h.estado).includes(buscadoNorm)
    );

    this.mostrarAcciones = !(estadoFicha.includes(buscadoNorm) || halladoEnHist);

    this.api
      .fichaAprobadaJuridicaFinanzas(this.idFicha)
      .subscribe({
        next : ({ aprobado }) => { this.puedeDescargar = aprobado; },
        error: err => {
          console.error('[Revisionficha] Error verificando aprobación', err);
          this.puedeDescargar = false;
        }
      });
  }

  /** Obtiene la ficha desde el backend y refresca el estado local */
  private refreshFicha() {
    if (!this.idFicha) { return; }
    this.api.dataFichaCompleta(this.idFicha).subscribe({
      next : (fc) => {
        this.fichaSrv.setFichaCompleta(fc);
        this.loadFichaFromData(fc);
      },
      error: err => console.error('[Revisionficha] Error refrescando ficha', err)
    });
  }



  ngOnInit(): void {

    console.log('[Revisionficha] ngOnInit > session =', this.session);

    // URL base para construir enlaces de descarga
    this.baseUrl = this.api.getBaseUrl();

    /* LOG 3 ─ comprobar si el método existe */
    console.log('[Revisionficha] typeof getTokenPayload =',
      typeof (this.session as any)?.getTokenPayload);

    /* 1️⃣  Datos de la ficha seleccionada */
    const fichaCompleta = this.fichaSrv.fichaCompletaValue;
    if (!fichaCompleta) { return; }

    this.loadFichaFromData(fichaCompleta);

    /* 2️⃣  User info desde el JWT */
    const userData = this.session.getTokenPayload()?.data;
    if (!userData) {
      this.msg.show('La sesión ha expirado. Serás redirigido en 5 segundos.');
      setTimeout(() => {
        window.location.href = 'https://sistemas.indap.cl';
      }, 5000);
      return;
    }

    /*   id_usuario_modificacion  =  RUT sin dígito verificador   */
    const rutSinDv = (userData.rut || '').split('-')[0];  // "16650344-2" -> "16650344"
    this.idUsuario = Number(rutSinDv);

    this.esAdmin = this.session.getUsuarioSistema() === true;



  }

  private normalizar(txt = ''): string {
    return txt
      .toLowerCase()
      .normalize('NFD')            // quita tildes
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
  datosValidos(doc: DocTabla): boolean {   // ← sin "private"
    return !!doc.observacion?.trim() && !!doc.fecha_vigencia;
  }


  guardar(doc: DocTabla) {
    console.log('[guardar] Iniciando guardado para documento:', doc);

    if (!this.datosValidos(doc)) {
      console.warn('[guardar] Datos inválidos - observación o fecha de vigencia faltante:', {
        observacion: doc.observacion,
        fecha_vigencia: doc.fecha_vigencia
      });
      this.msg.show('Debes ingresar observación y fecha de vigencia.');
      return;
    }

    const base = {
      observacion            : doc.observacion,
      fecha_vigencia         : doc.fecha_vigencia,
      id_usuario_modificacion: this.idUsuario,
    };

    console.log('[guardar] Datos válidos. Payload base a enviar:', base);
    console.log('[guardar] ID de observación existente:', doc.id_observacion_doc);

    const peticion$ = doc.id_observacion_doc
      ? this.api.actualizarObservacionDoc(doc.id_observacion_doc, base)
      : this.api.crearObservacionDoc({
        id_ficha: this.idFicha,
        id_documento: doc.id_documento,
        ...base
      });

    console.log('[guardar] Llamando a API con operación:',
      doc.id_observacion_doc ? 'Actualizar' : 'Crear');

    peticion$.subscribe({
      next: (res: any) => {
        console.log('[guardar] Respuesta exitosa de API:', res);

        if (res?.id_observacion_doc) {
          doc.id_observacion_doc = res.id_observacion_doc;
          console.log('[guardar] Se ha asignado nuevo id_observacion_doc:', res.id_observacion_doc);
        }

        doc.edit = false;
        console.log('[guardar] Documento actualizado localmente. edit = false');

        this.msg.show('Observación guardada correctamente.', 'success');
      },
      error: (err) => {
        console.error('[guardar] Error al guardar la observación:', err);
        this.msg.show('Error al guardar la observación.', 'error');
      }
    });
  }

  rechazarRevision() {
    if (!this.observacionDecision.trim()) {
      this.msg.show('Por favor ingresa una observación para el rechazo.');
      return;
    }

    this.api
      .cambiarEstadoFicha(
        this.idFicha,
        this.idUsuario,
        this.observacionDecision,
        'rechazado'
      )
      .subscribe({
        next: (res) => {
          this.msg.show(`Ficha rechazada: ${res.estado}`);
          this.refreshFicha();
        },
        error: (err) => {
          console.error(err);
          this.msg.show('Error al rechazar la ficha');
        }
      });
  }

  aprobarRevision() {
    /* 1️⃣  Perfil en sesión → texto */
    const perfilObj = this.session.getPerfilActual();         // {codigo, perfil}
    const perfilTxt = perfilObj?.perfil?.trim() || 'Perfil desconocido';

    /* 2️⃣  Nuevo estado + log */
    const nuevoEstado = `APROBADO - ${perfilTxt}`;
    console.log('[Revisionficha] nuevo estado:', nuevoEstado);

    /* 3️⃣  Enviar al backend */
    this.api.cambiarEstadoFicha(
      this.idFicha,
      this.idUsuario,
      this.observacionDecision || '',   // observaciones (puedes dejarla vacía)
      nuevoEstado as any                // ⬅️  Estado con “APROBADO - …”
    )
      .subscribe({
        next: (res) => {
          this.msg.show(`Ficha aprobada: ${res.estado}`);
          this.refreshFicha();
        },
        error: (err) => {
          console.error(err);
          this.msg.show('Error al aprobar la ficha');
        }
      });
  }

  onFileChange(evt: Event) {
    const f = (evt.target as HTMLInputElement).files?.[0];
    if (f) { this.selectedFile = f; this.mensaje = ''; }
  }

  subirCertificado() {
    if (!this.selectedFile || !this.idFicha || this.subiendo) { return; }
    this.subiendo = true;

    this.api.uploadRegistro1986(this.idFicha, this.selectedFile).subscribe({
      next : (res) => {
        this.mensaje = '✅ Certificado cargado correctamente';
        this.registro1986Cargado = true;
        this.documentos.push({
          id_documento: res.id_documento || 0,
          nombre      : this.selectedFile.name,
          categoria   : 'registro1986'
        });
        this.subiendo = false;
      },
      error: (err) => {
        this.mensaje = '❌ Error: ' + (err.error?.detail || 'no se pudo subir');
        this.subiendo = false;
      }
    });
  }

  buildFileUrl(ruta: string): string {
    const base = this.baseUrl.replace(/\/$/, '');
    const clean = ruta ? ruta.replace(/^\/+/, '') : '';
    return `${base}/uploads/${clean}`;
  }



  descargarDocumento(doc: DocTabla) {
    if (!doc.ruta_ftp) { return; }
    const url = this.buildFileUrl(doc.ruta_ftp);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
  }

  descargarCertificado() {
    if (!this.idFicha) { return; }

    this.api.downloadCertificado(this.idFicha).subscribe({
      next: (blob) => {
        // Opción A: Abrir en una pestaña nueva
        // const url = URL.createObjectURL(blob);
        // window.open(url, '_blank');

        // Opción B: Descargar directamente
        saveAs(blob, `certificado_${this.idFicha}.pdf`);
      },
      error: (err) => {
        console.error(err);
        this.msg.show('No se pudo generar el certificado PDF');
      }
    });
  }

  finalizarFicha() {
    if (!this.idFicha) { return; }
    this.api.cambiarEstadoFicha(
      this.idFicha,
      this.idUsuario,
      this.observacionFinal || '',
      'APROBADA' as any
    ).subscribe({
      next: (res) => {
        this.msg.show(`Ficha aprobada: ${res.estado}`);
        this.refreshFicha();
      },
      error: (err) => {
        console.error(err);
        this.msg.show('Error al aprobar la ficha');
      }
    });
  }

  rechazarFichaFinal() {
    if (!this.idFicha) { return; }
    if (!this.observacionFinal.trim()) {
      this.msg.show('Por favor ingresa una observación para el rechazo.');
      return;
    }
    this.api.cambiarEstadoFicha(
      this.idFicha,
      this.idUsuario,
      this.observacionFinal,
      'RECHAZADA - Pasara por nueva revisión' as any
    ).subscribe({
      next: (res) => {
        this.msg.show(`Ficha rechazada: ${res.estado}`);
        this.refreshFicha();
      },
      error: (err) => {
        console.error(err);
        this.msg.show('Error al rechazar la ficha');
      }
    });
  }

}
