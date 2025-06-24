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

  /** Valida los datos ingresados en el formulario. */
  private datosValidos(): boolean {
    const {
      numero_region,
      region,
      nombre,
      correo,
      cargo,
      unidad,
      rut
    } = this.form;

    if (!numero_region || !region || !nombre || !correo || !cargo || !unidad || !rut) {
      this.errorMsg = 'Todos los campos son obligatorios';
      return false;
    }

    if (!/^\d+$/.test(numero_region)) {
      this.errorMsg = 'N\u00ba Regi\u00f3n debe ser num\u00e9rico';
      return false;
    }

    const correoReg = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!correoReg.test(correo)) {
      this.errorMsg = 'Correo inv\u00e1lido';
      return false;
    }

    if (!this.validarRut(rut)) {
      this.errorMsg = 'RUT inv\u00e1lido';
      return false;
    }

    this.errorMsg = '';
    return true;
  }

  /** Valida el RUT chileno con su d\u00edgito verificador. */
  private validarRut(rut: string): boolean {
    if (!rut) { return false; }
    const limpio = rut.replace(/\./g, '').replace('-', '');
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1).toUpperCase();

    if (!/^\d+$/.test(cuerpo)) { return false; }

    let suma = 0;
    let mul = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += mul * Number(cuerpo.charAt(i));
      mul = mul === 7 ? 2 : mul + 1;
    }
    const resto = 11 - (suma % 11);
    const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

    return dv === dvEsperado;
  }

  guardar(): void {
    if (!this.datosValidos()) { return; }
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
