import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MensajeOverlayService } from '../services/serviceui/mensaje-overlay.service';

@Component({
  selector: 'app-mensaje-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="msgSvc.message$ | async as msg" class="modal-backdrop">
      <div class="modal-box">
        <p>{{ msg }}</p>
        <button class="btn btn-primary mt-3" (click)="msgSvc.hide()">Aceptar</button>
      </div>
    </div>
  `,
  styleUrls: ['./mensaje-overlay.component.css']
})
export class MensajeOverlayComponent {
  constructor(public msgSvc: MensajeOverlayService) {}
}
