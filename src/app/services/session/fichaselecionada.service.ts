import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FichaselecionadaService {

  private fichaSeleccionada$ = new BehaviorSubject<any>(null);
  private fichaCompleta$ = new BehaviorSubject<any>(null);

  public setFichaSeleccionada(ficha: any): void {
    this.fichaSeleccionada$.next(ficha);
  }

  /**
   * Devuelve el valor actual (no observable).
   * Para leerlo de forma puntual en otro componente (ej: ngOnInit).
   */
  public get fichaSeleccionadaValue(): any {
    return this.fichaSeleccionada$.value;
  }

  /**
   * Si prefieres observar los cambios en forma reactiva, usas este observable.
   */
  public getFichaSeleccionada$(): Observable<any> {
    return this.fichaSeleccionada$.asObservable();
  }

  // -----------------------------------------
  // Métodos para la ficha completa
  // -----------------------------------------
  public setFichaCompleta(data: any): void {
    this.fichaCompleta$.next(data);
  }

  public get fichaCompletaValue(): any {
    return this.fichaCompleta$.value;
  }

  public getFichaCompleta$(): Observable<any> {
    return this.fichaCompleta$.asObservable();
  }

}
