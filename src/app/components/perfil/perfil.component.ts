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

  constructor(private session: SesionAdminService) {}

  ngOnInit(): void {
    this.datos   = this.session.getUserData();
    this.region  = this.session.getRegionName() || '';
    this.esAdmin = this.session.getUsuarioSistema();
  }
}
