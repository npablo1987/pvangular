import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MenuadminComponent} from '../menuadmin/menuadmin.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { inject } from '@angular/core';

import {FichaselecionadaService} from '../../services/session/fichaselecionada.service';
import {ApiserviceIndapService} from '../../services/apis/apiservice-indap.service';
import {SesionAdminService} from '../../services/session/sesionadmin.service';
import {saveAs} from 'file-saver';

interface DocTabla {
  id_documento: number;
  nombre: string;
  categoria?: string;
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
  documentos: DocTabla[] = [];
  historial: any[] = [];
  observacionDecision: string = '';
  selectedFile!: File;
  subiendo   = false;
  mensaje    = '';
  mostrarAcciones = true;
  idUsuario!: number;                     // ← ahora será el RUT sin DV
  registro1986Cargado = false;

  private idFicha!: number;

  constructor(
    private fichaSrv : FichaselecionadaService,
    private api      : ApiserviceIndapService
  ) {

    console.log('[Revisionficha] constructor → session =', this.session);
  }



  ngOnInit(): void {

    console.log('[Revisionficha] ngOnInit > session =', this.session);

    /* LOG 3 ─ comprobar si el método existe */
    console.log('[Revisionficha] typeof getTokenPayload =',
      typeof (this.session as any)?.getTokenPayload);

    /* 1️⃣  Datos de la ficha seleccionada */
    const fichaCompleta = this.fichaSrv.fichaCompletaValue;
    if (!fichaCompleta) { return; }

    this.historial = fichaCompleta.historial ?? [];
    this.idFicha   = fichaCompleta.ficha?.id_ficha;

    /* 2️⃣  User info desde el JWT */
    const userData = this.session.getTokenPayload()?.data;
    if (!userData) {
      alert('La sesión ha expirado. Por favor vuelve a iniciar sesión.');
      return;
    }

    /*   id_usuario_modificacion  =  RUT sin dígito verificador   */
    const rutSinDv = (userData.rut || '').split('-')[0];  // "16650344-2" -> "16650344"
    this.idUsuario = Number(rutSinDv);

    /* 3️⃣  Documentos base */
    this.documentos = (fichaCompleta.documentos || []).map((d: any) => ({
      id_documento: d.id_documento,
      nombre      : d.nombre,
      categoria   : d.categoria
    }));

    this.registro1986Cargado = this.documentos.some(
      (d) => d.categoria === 'registro1986'
    );

    /* 4️⃣  Observaciones guardadas */
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

    const perfilObj = this.session.getPerfilActual();   // { codigo, perfil }
    const perfilTxt = perfilObj?.perfil || '';

    const estadoBuscado = `aprobado - ${perfilTxt}`;    // ya en minúsculas luego
    const buscadoNorm   = this.normalizar(estadoBuscado);

    const estadoFicha   = this.normalizar(fichaCompleta.ficha?.estado);
    const halladoEnHist = this.historial.some(h =>
      this.normalizar(h.estado).includes(buscadoNorm)
    );

    console.log('[Revisionficha] estadoFicha:', estadoFicha);
    console.log('[Revisionficha] buscamos   :', buscadoNorm);
    console.log('[Revisionficha] en historial:', halladoEnHist);

    this.mostrarAcciones = !(estadoFicha.includes(buscadoNorm) || halladoEnHist);



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
    if (!this.datosValidos(doc)) {
      alert('Debes ingresar observación y fecha de vigencia.');
      return;
    }

    const base = {
      observacion            : doc.observacion,
      fecha_vigencia         : doc.fecha_vigencia,
      id_usuario_modificacion: this.idUsuario,
    };

    (doc.id_observacion_doc
        ? this.api.actualizarObservacionDoc(doc.id_observacion_doc, base)
        : this.api.crearObservacionDoc({ id_ficha: this.idFicha, id_documento: doc.id_documento, ...base })
    ).subscribe((res: any) => {
      if (res?.id_observacion_doc) { doc.id_observacion_doc = res.id_observacion_doc; }
      doc.edit = false;
    });
  }

  rechazarRevision() {
    if (!this.observacionDecision.trim()) {
      alert('Por favor ingresa una observación para el rechazo.');
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
          alert(`Ficha rechazada: ${res.estado}`);
          // aquí podrías refrescar el listado, cerrar diálogo, etc.
        },
        error: (err) => {
          console.error(err);
          alert('Error al rechazar la ficha');
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
          alert(`Ficha aprobada: ${res.estado}`);
          // acciones posteriores...
        },
        error: (err) => {
          console.error(err);
          alert('Error al aprobar la ficha');
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
        alert('No se pudo generar el certificado PDF');
      }
    });
  }

}
