import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MensajeOverlayService } from '../services/serviceui/mensaje-overlay.service';

@Component({
  selector: 'app-mensaje-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="msgSvc.message$ | async as msg" class="overlay">
      <div class="mensaje">{{ msg }}</div>
    </div>
  `,
  styleUrls: ['./mensaje-overlay.component.css']
})
export class MensajeOverlayComponent {
  constructor(public msgSvc: MensajeOverlayService) {}
}
