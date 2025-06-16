import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { saveAs } from 'file-saver';

import {ApiserviceIndapService} from '../../services/apis/apiservice-indap.service';
import {FichaselecionadaService} from '../../services/session/fichaselecionada.service';
import {environment} from '../../environments/environment';
import {MenuadminComponent} from '../menuadmin/menuadmin.component';

@Component({
  selector: 'app-datos-empresa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuadminComponent
  ],
  templateUrl: './datos-empresa.component.html',
  styleUrl: './datos-empresa.component.css'
})
export class DatosEmpresaComponent implements OnInit  {


  private baseUrl = '';
  empresaForm: FormGroup;
  documentos: any[] = [];
  fichaCorta: any = null;
  fichaCompleta: any = null;

  constructor(
    private fb: FormBuilder,
    private fichaSrv: FichaselecionadaService,
    private apiService: ApiserviceIndapService,
    private router: Router
  ) {
    this.empresaForm = this.fb.group({
      rut: [''],
      razonSocial: [''],
      tipoEmpresa: [''],
      personalidadJuridica: [''],
      otorgadoPor: [''],
      areaTematica: [''],
      exentoContabilidad: [false],
      patrimonio: [''],
      capitalSocial: [''],
      estadoResultado: ['']
    });
  }

  ngOnInit(): void {

    // Usar la URL base calculada por el servicio para evitar "mixed content"
    this.baseUrl = this.apiService.getBaseUrl();

    this.fichaCorta = this.fichaSrv.fichaSeleccionadaValue;
    console.log('Ficha corta recibida:', this.fichaCorta);

    if (!this.fichaCorta || !this.fichaCorta.id_ficha) {
      console.warn('No se seleccionó ninguna ficha.');
      return;
    }

    this.apiService.dataFichaCompleta(this.fichaCorta.id_ficha).subscribe({
      next: (resp) => {
        console.log('Ficha completa:', resp);

        this.fichaSrv.setFichaCompleta(resp);
        this.fichaCompleta = resp;

        if (resp.persona_juridica) {
          this.empresaForm.patchValue({
            rut: resp.persona_juridica.rut,
            razonSocial: resp.persona_juridica.nombre_razon_social,
            tipoEmpresa: resp.persona_juridica.tipo_empresa,
            personalidadJuridica: resp.persona_juridica.numero_pj,
            otorgadoPor: resp.persona_juridica.otorgado_por,
            areaTematica: resp.persona_juridica.area_tematica,
            patrimonio: resp.persona_juridica.patrimonio,
            capitalSocial: resp.persona_juridica.capital_social,
            estadoResultado: resp.persona_juridica.estado_resultado
          });
        }

        if (resp.documentos) {
          this.documentos = resp.documentos;
        }
      },
      error: (err) => {
        console.error('Error al obtener ficha completa:', err);
      }
    });
  }

  buildFileUrl(ruta: string): string {
    const base = this.baseUrl.replace(/\/$/, '');
    const cleanRuta = ruta.replace(/^\/+/, '');
    return `${base}/uploads/${cleanRuta}`;
  }

  descargarDocumento(doc: any) {
    if (!doc?.ruta_ftp) { return; }
    this.apiService.downloadDocumento(doc.ruta_ftp).subscribe(blob => {
      const nombre = doc.nombre || 'archivo';
      saveAs(blob, nombre);
    });
  }
}
