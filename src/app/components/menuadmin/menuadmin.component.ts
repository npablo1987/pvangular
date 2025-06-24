import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FichaselecionadaService } from '../../services/session/fichaselecionada.service';

@Component({
  selector: 'app-menuadmin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menuadmin.component.html',
  styleUrl: './menuadmin.component.css'
})
export class MenuadminComponent implements OnInit {
  activeTab: string = 'Datos Empresa';
  fichaAprobada = false;

  private fichaSrv = inject(FichaselecionadaService);

  ngOnInit(): void {
    const evaluar = (fc: any) => {
      const estado = fc?.ficha?.estado || '';
      this.fichaAprobada = estado.trim().toUpperCase() === 'APROBADA';
    };
    evaluar(this.fichaSrv.fichaCompletaValue);
    this.fichaSrv.getFichaCompleta$().subscribe(evaluar);
  }

  setActive(tab: string) {
    this.activeTab = tab;
  }
}
