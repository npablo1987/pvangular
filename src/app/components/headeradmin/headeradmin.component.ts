import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import { SesionAdminService } from '../../services/session/sesionadmin.service';

@Component({
  selector: 'app-headeradmin',
  standalone : true,
  imports    : [
    CommonModule
  ],
  templateUrl: './headeradmin.component.html',
  styleUrl: './headeradmin.component.css'
})
export class HeaderadminComponent implements OnInit {

  nombreUsuario: string | null = null;

  private nivelFuente = 0;
  private readonly maxFuente = 2;
  private readonly minFuente = 0;

  constructor(
    @Inject(DOCUMENT) private readonly doc: Document,
    private readonly renderer: Renderer2,
    private sessionSrv: SesionAdminService,
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
      const nom = data.nombre || `${data.nombres ?? ''} ${data.apellido_paterno ?? ''} ${data.apellido_materno ?? ''}`;
      try {
        this.nombreUsuario = decodeURIComponent(escape(nom)).trim();
      } catch {
        this.nombreUsuario = nom.trim();
      }
    }
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

  /* -------- Helpers -------- */
  private aplicarFuente(): void {
    const html = this.doc.documentElement;
    ['a11y-font-0','a11y-font-1','a11y-font-2']
      .forEach(c => this.renderer.removeClass(html, c));
    this.renderer.addClass(html, `a11y-font-${this.nivelFuente}`);
  }
}
