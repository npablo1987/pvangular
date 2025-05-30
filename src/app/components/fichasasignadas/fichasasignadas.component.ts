import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SesionAdminService } from '../../services/session/sesionadmin.service';

import {PersonaJuridica} from '../../models/persona-juridica';
import {ApiserviceIndapService} from '../../services/apis/apiservice-indap.service';
import { FichaselecionadaService} from '../../services/session/fichaselecionada.service';

@Component({
  selector: 'app-fichasasignadas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fichasasignadas.component.html',
  styleUrls: ['./fichasasignadas.component.css']
})
export class FichasasignadasComponent implements OnInit{

  personas: PersonaJuridica[] = [];
  personasFiltradas: PersonaJuridica[] = [];
  filtro: string = "";
  pagina: number = 1;
  itemsPorPagina: number = 20;
  ordenActual: string = "";
  ordenAscendente: boolean = true;

  constructor(
    private router: Router,
    private apiService: ApiserviceIndapService,
    private sessionService: SesionAdminService,
    private fichaSrv: FichaselecionadaService,
  ) {}



  ngOnInit(): void {
    const { regionId } = this.sessionService.getRegionData();

    console.log('regionId:', regionId);  // ← IMPORTANTE para verificar

    if (!regionId) {
      console.error('No se encontró regionId válido');
      return;
    }

    // 2. Llamar al endpoint con estado "PendientedeRevision"
    this.cargarPersonasPendientes(regionId);
  }

  /**
   * Llama al endpoint GET /persona-juridica/region/{id_region}/estado/PendientedeRevision
   * y asigna la respuesta a `this.personas` y luego filtra.
   */
  cargarPersonasPendientes(regionId: number): void {
    // Ajusta si tu endpoint u objeto tiene distinto nombre de estado
    const estado = 'PendientedeRevision';
    this.apiService.consultarPersonasPorRegionYEstado(regionId, estado).subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos (PendientedeRevision):', data);
        this.personas = data;
        this.filtrarPersonas();
      },
      error: (err) => {
        console.error('❌ Error al cargar datos:', err);
      }
    });
  }


  seleccionarPersona(persona: any) {
    console.log('Ficha seleccionada:', persona);
    this.fichaSrv.setFichaSeleccionada(persona);
    this.router.navigate(['/datos-empresa']);
  }


  filtrarPersonas(): void {
    this.personasFiltradas = this.personas.filter(p =>
      p.rut.includes(this.filtro) ||
      p.nombre_razon_social.toLowerCase().includes(this.filtro.toLowerCase())
    );
  }

  ordenarPor(campo: keyof PersonaJuridica): void {
    if (this.ordenActual === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenActual = campo;
      this.ordenAscendente = true;
    }

    this.personasFiltradas.sort((a, b) => {
      let valorA = a[campo] as string;
      let valorB = b[campo] as string;
      return this.ordenAscendente
        ? valorA.localeCompare(valorB)
        : valorB.localeCompare(valorA);
    });
  }

  cambiarPagina(nuevaPagina: number): void {
    const totalPaginas = Math.ceil(this.personasFiltradas.length / this.itemsPorPagina);
    if (nuevaPagina > 0 && nuevaPagina <= totalPaginas) {
      this.pagina = nuevaPagina;
    }
  }
}
