import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),

      children: [
      {
        path: '',
        redirectTo: 'fichasasignadas',
        pathMatch: 'full',
      },
      {
        path: 'fichasasignadas',
        loadComponent: () =>
          import('./components/fichasasignadas/fichasasignadas.component')
            .then(m => m.FichasasignadasComponent),
      },
       {
        path: 'datos-empresa',
        loadComponent: () =>
          import('./components/datos-empresa/datos-empresa.component')
            .then(m => m.DatosEmpresaComponent),
      },
        {
          path: 'directorio',
          loadComponent: () =>
            import('./components/directorio/directorio.component')
              .then(m => m.DirectorioComponent),
        },
        {
          path: 'revisionficha',
          loadComponent: () =>
            import('./components/revisionficha/revisionficha.component').then(m => m.RevisionfichaComponent),

        },
        {
          path: 'ubicacion-contacto',
          loadComponent: () =>
            import('./components/ubicacion-contacto/ubicacion-contacto.component').then(m => m.UbicacionContactoComponent),
        },
        {
          path: 'certificado',
          loadComponent: () =>
            import('./components/certificado/certificado.component').then(m => m.CertificadoComponent),
        },
        {
          path: 'mis-movimientos',
          loadComponent: () =>
            import('./components/mis-movimientos/mis-movimientos.component').then(m => m.MisMovimientosComponent),
        },
        {
          path: 'perfil',
          loadComponent: () =>
            import('./components/perfil/perfil.component').then(m => m.PerfilComponent),
        },


    ],
  },
];
