import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import { SesionAdminService } from '../../services/session/sesionadmin.service';
import { FichaselecionadaService } from '../../services/session/fichaselecionada.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-headeradmin',
  standalone : true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './headeradmin.component.html',
  styleUrl: './headeradmin.component.css'
})
export class HeaderadminComponent implements OnInit {

  nombreUsuario = 'Usuario';
  pendingCount = 0;
  esAdmin: boolean | null = null;

  private nivelFuente = 0;
  private readonly maxFuente = 2;
  private readonly minFuente = 0;

  constructor(
    @Inject(DOCUMENT) private readonly doc: Document,
    private readonly renderer: Renderer2,
    private sessionSrv: SesionAdminService,
    private fichaSrv: FichaselecionadaService,
  ) {

  }


  ngOnInit(): void {
    const savedSize = Number(localStorage.getItem('nivelFuente'));
    if (!isNaN(savedSize)) { this.nivelFuente = savedSize; }

    if (localStorage.getItem('contraste') === '1') {
      this.renderer.addClass(this.doc.documentElement, 'a11y-contrast');
    }
    this.aplicarFuente();

    const data = this.sessionSrv.getUserData();
    if (data) {
      const nomCortoRaw = this.obtenerNombreCorto(data);
      try {
        this.nombreUsuario = this.decodeHtml(nomCortoRaw);
      } catch {
        this.nombreUsuario = nomCortoRaw;
      }
    }

    this.esAdmin = this.sessionSrv.getUsuarioSistema();

    this.fichaSrv.getFichasPendientes$().subscribe(n => {
      this.pendingCount = n;
    });
  }

  toggleContraste(ev: Event): void {
    ev.preventDefault();
    const html = this.doc.documentElement;
    const activo = html.classList.contains('a11y-contrast');

    if (activo) {
      this.renderer.removeClass(html, 'a11y-contrast');
      localStorage.setItem('contraste', '0');
    } else {
      this.renderer.addClass(html, 'a11y-contrast');
      localStorage.setItem('contraste', '1');
    }
  }


  cambiarTamanoFuente(dir: number, ev: Event): void {
    ev.preventDefault();
    const nuevo = Math.min(this.maxFuente,
      Math.max(this.minFuente, this.nivelFuente + dir));
    if (nuevo === this.nivelFuente) { return; }

    this.nivelFuente = nuevo;
    localStorage.setItem('nivelFuente', String(nuevo));
    this.aplicarFuente();
  }

  logout(ev?: Event): void {
    if (ev) { ev.preventDefault(); }
    this.sessionSrv.clearAll();
    window.location.href = 'https://sistemas.indap.cl';
  }

  /* -------- Helpers -------- */
  private aplicarFuente(): void {
    const html = this.doc.documentElement;
    ['a11y-font-0','a11y-font-1','a11y-font-2']
      .forEach(c => this.renderer.removeClass(html, c));
    this.renderer.addClass(html, `a11y-font-${this.nivelFuente}`);
  }

  private decodeHtml(text: string): string {
    const txt = this.doc.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  }

  private obtenerNombreCorto(data: any): string {
    const altNombres  = data?.respuesta_xml?.documento?.datosPersonal?.nombre?.nombres;
    const altApellido = data?.respuesta_xml?.documento?.datosPersonal?.nombre?.apellidoPaterno;
    if (altNombres || altApellido) {
      return `${altNombres ?? ''} ${altApellido ?? ''}`.trim();
    }

    const nombreFull = `${data.nombre ?? ''}`.trim();
    if (nombreFull) {
      return nombreFull.split(/\s+/).slice(0, 2).join(' ');
    }

    const primerNombre   = `${data.nombres ?? ''}`.trim().split(/\s+/)[0] ?? '';
    const primerApellido = `${data.apellido_paterno ?? ''}`.trim().split(/\s+/)[0] ?? '';
    const res = `${primerNombre} ${primerApellido}`.trim();
    return res || data?.rut_enviado || '';
  }
}
