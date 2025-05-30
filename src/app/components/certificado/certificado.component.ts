import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }             from '@angular/common';
import { RouterModule }             from '@angular/router';
import {
  FormBuilder, Validators, FormGroup,
  FormsModule, ReactiveFormsModule
} from '@angular/forms';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


import {ApiserviceIndapService} from '../../services/apis/apiservice-indap.service';
import {FichaselecionadaService} from '../../services/session/fichaselecionada.service';
import {SesionAdminService} from '../../services/session/sesionadmin.service';
import {MenuadminComponent} from '../menuadmin/menuadmin.component';

@Component({
  selector: 'app-certificado',
  standalone : true,
  imports    : [
    CommonModule, RouterModule,
    FormsModule,  ReactiveFormsModule,
    MenuadminComponent
  ],
  templateUrl: './certificado.component.html',
  styleUrl: './certificado.component.css'
})
export class CertificadoComponent implements OnInit {

  /* ──────────── inyección de dependencias ──────────── */
  private api        = inject(ApiserviceIndapService);
  private fichaSrv   = inject(FichaselecionadaService);
  private session    = inject(SesionAdminService);
  private fb         = inject(FormBuilder);
  private sanitizer  = inject(DomSanitizer);

  /* ──────────── contexto ──────────── */
  idFicha   = 0;
  idUsuario = 0;

  /* ──────────── pre-visualización ──────────── */
  pdfUrl: SafeResourceUrl | null = null;   // ← src para <iframe>
  pdfBlobUrl = '';                         // ← link de descarga

  /* ──────────── formulario ──────────── */
  form: FormGroup = this.fb.group({
    nroResolucion  : ['', Validators.required],
    fechaResolucion: ['', Validators.required],
    archivo        : [null, Validators.required]   // File | null
  });

  estadoSubida: 'pendiente' | 'subiendo' | 'subido' | 'error' = 'pendiente';
  mensaje = '';

  /* =============================================================== */
  /*                   Util – genera vista previa                    */
  /* =============================================================== */
  private visualizarPdf(): void {
    this.api.downloadCertificadoRFP(this.idFicha).subscribe({
      next: blob => {
        if (this.pdfBlobUrl) { URL.revokeObjectURL(this.pdfBlobUrl); }
        this.pdfBlobUrl = URL.createObjectURL(blob);
        this.pdfUrl     = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl);
      },
      error: err => {
        console.error('Error descargando PDF', err);
        this.estadoSubida = 'error';
        this.mensaje      = '❌ No se pudo obtener el certificado';
      }
    });
  }

  /* =============================================================== */
  /*                              init                               */
  /* =============================================================== */
  ngOnInit(): void {
    const fc = this.fichaSrv.fichaCompletaValue;
    if (!fc) { return; }

    this.idFicha   = fc.ficha.id_ficha;
    this.idUsuario = Number((this.session.getTokenPayload()?.data?.rut || '').split('-')[0]);

    /* 1️⃣  ¿ya existe Certificado RFP? */
    this.api.getCertificadoRFPmeta(this.idFicha).subscribe({
      next: () => {                 // 200 → existe
        this.estadoSubida = 'subido';
        this.mensaje      = 'Esta ficha ya posee un Certificado RFP';
        this.form.disable();
        this.visualizarPdf();       // ← renderizamos
      },
      error: err => {               // 404 → aún no
        if (err.status !== 404) { console.error(err); }
        this.estadoSubida = 'pendiente';
      }
    });
  }

  /* =============================================================== */
  /*                            eventos                             */
  /* =============================================================== */
  onFileChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.form.patchValue({ archivo: f });
  }

  subir() {
    if (this.form.invalid || this.estadoSubida === 'subiendo') { return; }

    const { nroResolucion, fechaResolucion, archivo } = this.form.value;
    this.estadoSubida = 'subiendo';

    this.api.uploadCertificadoRFP(
      this.idFicha,
      archivo as File,
      nroResolucion!,
      fechaResolucion!,
      this.idUsuario
    ).subscribe({
      next: () => {
        this.estadoSubida = 'subido';
        this.mensaje      = '✅ Certificado RFP subido correctamente';
        this.form.disable();
        this.visualizarPdf();       // ← mostramos lo recién cargado
      },
      error: err => {
        this.estadoSubida = 'error';
        this.mensaje =
          err.status === 409
            ? '⚠️ Esta ficha ya tiene un Certificado RFP'
            : '❌ Error al subir el certificado';
      }
    });
  }
}

