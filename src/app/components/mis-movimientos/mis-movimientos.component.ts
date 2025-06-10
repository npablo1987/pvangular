import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiserviceIndapService } from '../../services/apis/apiservice-indap.service';
import { SesionAdminService } from '../../services/session/sesionadmin.service';

@Component({
  selector: 'app-mis-movimientos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-movimientos.component.html',
  styleUrl: './mis-movimientos.component.css'
})
export class MisMovimientosComponent implements OnInit {
  movimientos: any[] = [];
  cargando = false;

  constructor(
    private api: ApiserviceIndapService,
    private session: SesionAdminService
  ) {}

  ngOnInit(): void {
    const rutBase = this.session.getRutBase();
    if (!rutBase) { return; }
    this.cargando = true;
    this.api.obtenerMovimientosPorRut(rutBase).subscribe({
      next: data => { this.movimientos = data || []; },
      error: err => console.error('Error obteniendo movimientos', err),
      complete: () => { this.cargando = false; }
    });
  }
}
