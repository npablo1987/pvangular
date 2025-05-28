import { Component, Input } from '@angular/core';
import { LoadingService } from '../../services/serviceui/loading.service';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-cargando-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loader.isVisible$ | async" class="overlay">
      <div class="spinner"></div>
    </div>
  `,
  styleUrls: ['./cargando-overlay.component.css']
})
export class CargandoOverlayComponent {
  constructor(public loader: LoadingService) {}
}
