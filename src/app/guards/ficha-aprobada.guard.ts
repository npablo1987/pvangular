import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FichaselecionadaService } from '../services/session/fichaselecionada.service';
import { MensajeOverlayService } from '../services/serviceui/mensaje-overlay.service';

export const fichaAprobadaGuard: CanActivateFn = () => {
  const fichaSrv = inject(FichaselecionadaService);
  const router = inject(Router);
  const msg = inject(MensajeOverlayService);

  const fc = fichaSrv.fichaCompletaValue;
  const estado = fc?.ficha?.estado;
  const estadoActual = typeof estado === 'string' && estado.trim().toUpperCase();
  const hist = Array.isArray(fc?.historial) ? fc.historial : [];
  const aprobadaHist = hist.some(h => (h?.estado || '').trim().toUpperCase() === 'APROBADA');
  const aprobada = estadoActual === 'APROBADA' || aprobadaHist;

  if (aprobada) {
    return true;
  }

  msg.show('La ficha debe estar APROBADA para acceder al certificado.', 'error');
  router.navigate(['/revisionficha']);
  return false;
};
