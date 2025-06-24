import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FichaselecionadaService } from '../services/session/fichaselecionada.service';
import { MensajeOverlayService } from '../services/serviceui/mensaje-overlay.service';

export const fichaAprobadaGuard: CanActivateFn = () => {
  const fichaSrv = inject(FichaselecionadaService);
  const router = inject(Router);
  const msg = inject(MensajeOverlayService);

  const fc        = fichaSrv.fichaCompletaValue;
  const estado    = fc?.ficha?.estado || '';
  const historial = Array.isArray(fc?.historial) ? fc.historial : [];

  const estadoOK  = estado.trim().toUpperCase() === 'APROBADA';
  const histOK    = historial.some(h =>
    String(h?.estado || '').trim().toUpperCase() === 'APROBADA'
  );
  const aprobada  = estadoOK || histOK;

  if (aprobada) {
    return true;
  }

  msg.show('La ficha debe estar APROBADA para acceder al certificado.', 'error');
  router.navigate(['/revisionficha']);
  return false;
};
