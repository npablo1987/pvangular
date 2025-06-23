import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiserviceIndapService } from '../../services/apis/apiservice-indap.service';
import { SesionAdminService } from '../../services/session/sesionadmin.service';

@Component({
  selector   : 'app-usuarios-sistema',
  standalone : true,
  imports    : [CommonModule, FormsModule, RouterModule],
  templateUrl: './usuarios-sistema.component.html',
  styleUrl   : './usuarios-sistema.component.css'
})
export class UsuariosSistemaComponent implements OnInit {
  esAdmin = false;
  usuarios: any[] = [];
  editId: number | null = null;
  errorMsg = '';

  form: any = {
    numero_region: '',
    region: '',
    nombre: '',
    correo: '',
    cargo: '',
    unidad: '',
    rut: ''
  };

  constructor(
    private api: ApiserviceIndapService,
    private session: SesionAdminService
  ) {}

  ngOnInit(): void {
    this.esAdmin = this.session.getUsuarioSistema() === true;
    if (this.esAdmin) { this.cargarUsuarios(); }
  }

  cargarUsuarios(): void {
    const token = this.session.getToken();
    if (!token) {
      this.errorMsg = 'Sesión expirada';
      return;
    }
    this.api.listarUsuariosSistema(token).subscribe({
      next: data => { this.usuarios = data || []; },
      error: err => {
        console.error('Error cargando usuarios', err);
        this.errorMsg = 'Error al obtener usuarios';
      }
    });
  }

  editar(u: any): void {
    this.editId = u.id_usersistema;
    const { inregion, ...rest } = u;
    this.form = { ...rest };
  }

  cancelar(): void {
    this.editId = null;
    this.form = {
      numero_region: '',
      region: '',
      nombre: '',
      correo: '',
      cargo: '',
      unidad: '',
      rut: ''
    };
  }

  guardar(): void {
    const token = this.session.getToken();
    if (!token) {
      this.errorMsg = 'Sesión expirada';
      return;
    }
    const payload = { ...this.form };
    if (this.editId) {
      this.api.actualizarUsuarioSistema(this.editId, payload, token).subscribe({
        next: () => { this.cancelar(); this.cargarUsuarios(); },
        error: err => console.error('Error actualizando', err)
      });
    } else {
      this.api.crearUsuarioSistema(payload, token).subscribe({
        next: () => { this.cancelar(); this.cargarUsuarios(); },
        error: err => console.error('Error creando', err)
      });
    }
  }

  cambiarEstado(u: any): void {
    const token = this.session.getToken();
    if (!token) { return; }
    const nuevoEstado = !u.estado;
    this.api.cambiarEstadoUsuarioSistema(u.id_usersistema, nuevoEstado, token).subscribe({
      next: () => { u.estado = nuevoEstado; },
      error: err => console.error('Error cambiando estado', err)
    });
  }
}
