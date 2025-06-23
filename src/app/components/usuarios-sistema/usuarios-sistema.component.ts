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
    inregion: '',
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
    this.api.listarUsuariosSistema().subscribe({
      next: data => { this.usuarios = data || []; },
      error: err => {
        console.error('Error cargando usuarios', err);
        this.errorMsg = 'Error al obtener usuarios';
      }
    });
  }

  editar(u: any): void {
    this.editId = u.id_usersistema;
    this.form = { ...u };
  }

  cancelar(): void {
    this.editId = null;
    this.form = {
      numero_region: '',
      inregion: '',
      region: '',
      nombre: '',
      correo: '',
      cargo: '',
      unidad: '',
      rut: ''
    };
  }

  guardar(): void {
    const payload = { ...this.form };
    if (this.editId) {
      this.api.actualizarUsuarioSistema(this.editId, payload).subscribe({
        next: () => { this.cancelar(); this.cargarUsuarios(); },
        error: err => console.error('Error actualizando', err)
      });
    } else {
      this.api.crearUsuarioSistema(payload).subscribe({
        next: () => { this.cancelar(); this.cargarUsuarios(); },
        error: err => console.error('Error creando', err)
      });
    }
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar usuario?')) { return; }
    this.api.eliminarUsuarioSistema(id).subscribe({
      next: () => this.cargarUsuarios(),
      error: err => console.error('Error eliminando', err)
    });
  }
}
