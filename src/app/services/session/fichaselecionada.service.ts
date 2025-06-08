import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FichaselecionadaService {

  private readonly SELECTED_KEY  = 'fichaSeleccionada';
  private readonly COMPLETA_KEY  = 'fichaCompleta';

  private fichaSeleccionada$ = new BehaviorSubject<any>(null);
  private fichaCompleta$     = new BehaviorSubject<any>(null);

  constructor() {
    const selRaw  = localStorage.getItem(this.SELECTED_KEY);
    const compRaw = localStorage.getItem(this.COMPLETA_KEY);

    if (selRaw)  { this.fichaSeleccionada$.next(JSON.parse(selRaw)); }
    if (compRaw) { this.fichaCompleta$.next(JSON.parse(compRaw)); }
  }

  public setFichaSeleccionada(ficha: any): void {
    this.fichaSeleccionada$.next(ficha);
    if (ficha === null) {
      localStorage.removeItem(this.SELECTED_KEY);
    } else {
      localStorage.setItem(this.SELECTED_KEY, JSON.stringify(ficha));
    }
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
    if (data === null) {
      localStorage.removeItem(this.COMPLETA_KEY);
    } else {
      localStorage.setItem(this.COMPLETA_KEY, JSON.stringify(data));
    }
  }

  public get fichaCompletaValue(): any {
    return this.fichaCompleta$.value;
  }

  public getFichaCompleta$(): Observable<any> {
    return this.fichaCompleta$.asObservable();
  }

  /** Limpia todos los datos almacenados */
  public clear(): void {
    this.fichaSeleccionada$.next(null);
    this.fichaCompleta$.next(null);
    localStorage.removeItem(this.SELECTED_KEY);
    localStorage.removeItem(this.COMPLETA_KEY);
  }

}
