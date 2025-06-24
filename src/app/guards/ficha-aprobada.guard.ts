import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FichaselecionadaService } from '../services/session/fichaselecionada.service';
import { MensajeOverlayService } from '../services/serviceui/mensaje-overlay.service';

export const fichaAprobadaGuard: CanActivateFn = () => {
  const fichaSrv = inject(FichaselecionadaService);
  const router = inject(Router);
  const msg = inject(MensajeOverlayService);

  const estado = fichaSrv.fichaCompletaValue?.ficha?.estado;
  const aprobada = typeof estado === 'string' && estado.trim().toUpperCase() === 'APROBADA';

  if (aprobada) {
    return true;
  }

  msg.show('La ficha debe estar APROBADA para acceder al certificado.', 'error');
  router.navigate(['/revisionficha']);
  return false;
};
