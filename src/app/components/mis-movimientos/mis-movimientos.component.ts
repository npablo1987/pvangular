import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiserviceIndapService } from '../../services/apis/apiservice-indap.service';
import { SesionAdminService } from '../../services/session/sesionadmin.service';
import { FichaselecionadaService } from '../../services/session/fichaselecionada.service';

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
  errorMsg = '';
  warningMsg = '';

  constructor(
    private api: ApiserviceIndapService,
    private session: SesionAdminService,
    private fichaSrv: FichaselecionadaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const rutBase = this.session.getRutBase();
    if (!rutBase) { return; }
    this.cargando = true;
    this.errorMsg = '';
    this.warningMsg = '';
    this.api.obtenerMovimientosPorRut(rutBase).subscribe({
      next: data => {
        this.movimientos = data || [];
        if (!this.movimientos.length) {
          this.warningMsg = 'No se encontraron movimientos.';
        }
      },
      error: err => {
        console.error('Error obteniendo movimientos', err);
        this.errorMsg = 'Ocurri\u00f3 un error al obtener los movimientos.';
      },
      complete: () => { this.cargando = false; }
    });
  }

  verFicha(mov: any): void {
    if (!mov?.id_ficha) { return; }
    this.fichaSrv.setFichaSeleccionada({ id_ficha: mov.id_ficha });
    this.router.navigate(['/datos-empresa']);
  }
}
