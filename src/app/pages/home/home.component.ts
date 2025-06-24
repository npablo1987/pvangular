import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { HeaderadminComponent } from '../../components/headeradmin/headeradmin.component';
import { PieadminComponent } from '../../components/pieadmin/pieadmin.component';
import { FichaselecionadaService } from '../../services/session/fichaselecionada.service';
import { SesionAdminService } from '../../services/session/sesionadmin.service';
import { ApiserviceIndapService } from '../../services/apis/apiservice-indap.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [HeaderadminComponent, PieadminComponent, RouterOutlet, RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  pendientes = 0;
  aprobadas = 0;
  esAdmin = false;
  showAlert = true;
  showFinalAlert = true;

  constructor(
    private fichaSrv: FichaselecionadaService,
    private router: Router,
    private sessionSrv: SesionAdminService,
    private apiSrv: ApiserviceIndapService,
  ) {}

  ngOnInit(): void {
    this.fichaSrv.getFichasPendientes$().subscribe(n => this.pendientes = n);
    this.esAdmin = this.sessionSrv.getUsuarioSistema() === true;
    if (this.esAdmin) {
      this.apiSrv.totalAprobadasJuridicaFinanzas().subscribe(res => {
        this.aprobadas = res.total;
      });
    }
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        this.showAlert = true;
        this.showFinalAlert = true;
      }
    });
  }

  dismissAlert(): void {
    this.showAlert = false;
  }

  dismissFinalAlert(): void {
    this.showFinalAlert = false;
  }
}
