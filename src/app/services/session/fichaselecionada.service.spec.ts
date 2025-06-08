import { TestBed } from '@angular/core/testing';

import { FichaselecionadaService } from './fichaselecionada.service';

describe('FichaselecionadaService', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    const service = TestBed.inject(FichaselecionadaService);
    expect(service).toBeTruthy();
  });

  it('should persist selection in localStorage', () => {
    const service = new FichaselecionadaService();
    const ficha = { id: 1 };
    service.setFichaSeleccionada(ficha);
    expect(JSON.parse(localStorage.getItem('fichaSeleccionada')!)).toEqual(ficha);
  });

  it('should load initial data from localStorage', () => {
    const data = { id: 2 };
    localStorage.setItem('fichaSeleccionada', JSON.stringify(data));
    const service = new FichaselecionadaService();
    expect(service.fichaSeleccionadaValue).toEqual(data);
  });
});
