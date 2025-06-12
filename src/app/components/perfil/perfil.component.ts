import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SesionAdminService } from '../../services/session/sesionadmin.service';

@Component({
  selector   : 'app-perfil',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl   : './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  datos: any = null;
  region = '';
  esAdmin: boolean | null = null;
  nombreCompleto = '';
  perfilActual: { codigo: number; perfil: string } | null = null;

  constructor(private session: SesionAdminService) {}

  ngOnInit(): void {
    this.datos        = this.session.getUserData();
    this.region       = this.session.getRegionName() || '';
    this.esAdmin      = this.session.getUsuarioSistema();
    this.perfilActual = this.session.getPerfilActual();

    if (this.datos) {
      const decode = (t: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = t;
        return txt.value;
      };

      if (this.datos.nombre) {
        this.nombreCompleto = decode(this.datos.nombre).trim();
      } else {
        const partes = [
          this.datos.nombres,
          this.datos.apellido_paterno,
          this.datos.apellido_materno,
        ]
          .filter(Boolean)
          .map((s: string) => decode(s));
        this.nombreCompleto = partes.join(' ').trim();
      }
    }
  }
}
