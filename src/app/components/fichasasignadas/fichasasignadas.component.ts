import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';
import { FormsModule }       from '@angular/forms';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';

import { timer, EMPTY, of }  from 'rxjs';
import { switchMap, map, take, catchError, finalize } from 'rxjs/operators';

import { PersonaJuridica }           from '../../models/persona-juridica';
import { ApiserviceIndapService }    from '../../services/apis/apiservice-indap.service';
import { SesionAdminService }        from '../../services/session/sesionadmin.service';
import { FichaselecionadaService }   from '../../services/session/fichaselecionada.service';
import { LoadingService }            from '../../services/serviceui/loading.service';

@Component({
  selector   : 'app-fichasasignadas',
  standalone : true,
  imports    : [CommonModule, FormsModule, RouterModule],
  templateUrl: './fichasasignadas.component.html',
  styleUrls  : ['./fichasasignadas.component.css']
})
export class FichasasignadasComponent implements OnInit {

  personas:          PersonaJuridica[] = [];
  personasFiltradas: PersonaJuridica[] = [];

  filtro          = '';
  pagina          = 1;
  itemsPorPagina  = 20;
  ordenActual:    keyof PersonaJuridica | '' = '';
  ordenAscendente = true;

  private datosCargados = false;

  constructor(
    private router      : Router,
    private apiService  : ApiserviceIndapService,
    private sessionSrv  : SesionAdminService,
    private fichaSrv    : FichaselecionadaService,
    public  loader      : LoadingService
  ) {}

  /* ════════════════════════════════════════════════════════════ */
  ngOnInit(): void {
    const MAX_INTENTOS = 5;     // cuántas veces reintenta
    const RETARDO_MS   = 2000;  // intervalo entre reintentos

    timer(0, RETARDO_MS).pipe(
      take(MAX_INTENTOS),

      /* 1) intentamos leer región y rutBase del servicio de sesión */
      map(() => ({
        regionId : this.sessionSrv.getRegionId(),   // number | null
        rutBase  : this.sessionSrv.getRutBase()     // string | null
      })),

      /* 2) si falta algo aún, esperamos próxima emisión */
      switchMap(({ regionId, rutBase }) => {
        if (!regionId || !rutBase || this.datosCargados) {
          return EMPTY;
        }

        this.datosCargados = true;       // evita más reintentos
        this.loader.show();              // ⬅️ loader SOLO cuando partimos

        /* 3) preguntamos al backend si el RUT está en usersistema */
        return this.apiService.verificarUsuariosSistema([rutBase]).pipe(
          map(arr => ({
            esAdmin : arr[0]?.existe === true,
            regionId
          })),
          catchError(() => of({ esAdmin: false, regionId })),

          /* 4) según rol llamamos al endpoint adecuado */
          switchMap(({ esAdmin, regionId }) => {
            const ESTADO = 'PendientedeRevision';
            return esAdmin
              ? this.apiService.consultarPersonasPorEstado(ESTADO)
              : this.apiService.consultarPersonasPorRegionYEstado(regionId, ESTADO);
          }),

          /* 5) cuando termina todo -> ocultamos loader */
          finalize(() => this.loader.hide())
        );
      })
    ).subscribe({
      next : data  => { this.personas = data; this.filtrarPersonas(); },
      error: err   => console.error('❌ Error obteniendo datos:', err)
    });
  }

  /* ════════════════════════════════════════════════════════════
   *   UTILIDADES
   * ════════════════════════════════════════════════════════════ */
  seleccionarPersona(pj: PersonaJuridica) {
    this.fichaSrv.setFichaSeleccionada(pj);
    this.router.navigate(['/datos-empresa']);
  }

  filtrarPersonas(): void {
    const f = this.filtro.toLowerCase();
    this.personasFiltradas = this.personas.filter(p =>
      p.rut.includes(this.filtro) ||
      p.nombre_razon_social.toLowerCase().includes(f)
    );
  }

  ordenarPor(campo: keyof PersonaJuridica): void {
    this.ordenAscendente = (this.ordenActual === campo) ? !this.ordenAscendente : true;
    this.ordenActual = campo;

    this.personasFiltradas.sort((a, b) => {
      const [A, B] = [String(a[campo]), String(b[campo])];
      return this.ordenAscendente ? A.localeCompare(B) : B.localeCompare(A);
    });
  }

  cambiarPagina(n: number): void {
    const total = Math.ceil(this.personasFiltradas.length / this.itemsPorPagina);
    if (n > 0 && n <= total) { this.pagina = n; }
  }
}
