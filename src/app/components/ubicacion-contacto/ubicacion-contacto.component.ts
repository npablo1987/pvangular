import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MenuadminComponent} from '../menuadmin/menuadmin.component';
import { ApiserviceIndapService} from '../../services/apis/apiservice-indap.service';
import { FichaselecionadaService} from '../../services/session/fichaselecionada.service';

@Component({
  selector: 'app-ubicacion-contacto',
  imports: [CommonModule, MenuadminComponent, ReactiveFormsModule ],
  templateUrl: './ubicacion-contacto.component.html',
  styleUrl: './ubicacion-contacto.component.css'
})
export class UbicacionContactoComponent implements OnInit{

  ubicacionForm: FormGroup;

  regiones: any[] = [];
  comunas: any[] = [];

  fichaCompleta: any = null;

  constructor(
    private fb: FormBuilder,
    private fichaSrv: FichaselecionadaService,
    private apiService: ApiserviceIndapService
  ) {
    // Definimos los campos de nuestro formulario
    this.ubicacionForm = this.fb.group({
      region: [null],
      comuna: [null],
      direccion: [''],
      numero: [''],
      sinNumero: [false],
      correo: [''],
      telefono: ['']
    });
  }

  ngOnInit(): void {
    this.fichaCompleta = this.fichaSrv.fichaCompletaValue;
    console.log('Ficha completa en UbicacionContacto:', this.fichaCompleta);

    if (!this.fichaCompleta || !this.fichaCompleta.ficha) {
      console.warn('No hay fichaCompleta cargada.');
      return;
    }

    const regionId = this.fichaCompleta.ficha.id_region;
    const comunaId = this.fichaCompleta.ficha.id_comuna;

    console.log("Region id:", regionId);
    console.log("Comuna id:", comunaId);

    // 3) Cargar todas las regiones
    this.apiService.obtenerRegiones().subscribe({
      next: (resp) => {
        console.log('Respuesta al cargar Regiones:', resp);
        this.regiones = resp.data; // <-- array con { id_region, nombre, ... }

        // Corrección aquí:
        const regionSeleccionada = this.regiones.find(region => region.id_region === regionId);
        console.log('Región seleccionada:', regionSeleccionada);

        if (regionSeleccionada) {
          this.regiones = [regionSeleccionada]; // por si lo necesitas para otra cosa
          this.ubicacionForm.patchValue({ region: regionSeleccionada.nombre });
          this.cargarComunasPorRegion(regionId, comunaId);
        }
      },
      error: (err) => {
        console.error('Error al cargar regiones:', err);
      }
    });

    const pj = this.fichaCompleta.persona_juridica || {};
    this.ubicacionForm.patchValue({
      direccion: pj.direccion || '',
      numero: pj.numero || '',
      sinNumero: pj.sinNumero ?? false,
      correo: pj.correo || '',
      telefono: pj.telefono || ''
    });
  }


  private cargarComunasPorRegion(regionId: number, comunaId?: number) {
    this.apiService.obtenerComunasPorRegion(regionId).subscribe({
      next: (resp) => {
        console.log('Resp al cargar comunas:', resp);
        this.comunas = resp.data;

        if (comunaId) {
          this.ubicacionForm.patchValue({ comuna: comunaId });

          const comunaSeleccionada = this.comunas.find(comuna => comuna.id_comuna === comunaId);
          console.log('Comuna seleccionada:', comunaSeleccionada);

          if (comunaSeleccionada) {
            this.comunas = [comunaSeleccionada]; // opcional
            this.ubicacionForm.patchValue({ comuna: comunaSeleccionada.nombre });
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar comunas:', err);
      }
    });
  }


}

