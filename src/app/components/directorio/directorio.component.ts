import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {MenuadminComponent} from '../menuadmin/menuadmin.component';
import {FichaselecionadaService} from '../../services/session/fichaselecionada.service';

@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [CommonModule, MenuadminComponent, RouterModule],
  templateUrl: './directorio.component.html',
  styleUrl: './directorio.component.css'
})
export class DirectorioComponent implements OnInit{
  /** array con los miembros del directorio */
  directorio: any[] = [];

  constructor(private fichaSrv: FichaselecionadaService) {}

  ngOnInit(): void {
    // la ficha completa se guardó previamente en setFichaCompleta(resp)
    const fichaCompleta = this.fichaSrv.fichaCompletaValue;

    // Si existe, tomamos el array "directorio"
    this.directorio = fichaCompleta?.directorio ?? [];
  }
}
