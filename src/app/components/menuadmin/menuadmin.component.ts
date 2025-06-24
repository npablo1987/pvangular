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
      const estadoActual = (fc?.ficha?.estado || '').trim().toUpperCase();
      const hist = Array.isArray(fc?.historial) ? fc.historial : [];
      const aprobadaEnHist = hist.some((h: any) =>
        (h?.estado || '').trim().toUpperCase() === 'APROBADA'
      );

      this.fichaAprobada = estadoActual === 'APROBADA' || aprobadaEnHist;
    };

    evaluar(this.fichaSrv.fichaCompletaValue);
    this.fichaSrv.getFichaCompleta$().subscribe(evaluar);
  }

  setActive(tab: string) {
    this.activeTab = tab;
  }
}
