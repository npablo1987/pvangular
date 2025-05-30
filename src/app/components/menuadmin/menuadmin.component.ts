import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menuadmin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menuadmin.component.html',
  styleUrl: './menuadmin.component.css'
})
export class MenuadminComponent {
  activeTab: string = 'Datos Empresa';

  setActive(tab: string) {
    this.activeTab = tab; // Aquí se actualiza correctamente el estado
  }
}
