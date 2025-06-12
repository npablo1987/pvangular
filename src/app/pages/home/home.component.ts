import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HeaderadminComponent } from '../../components/headeradmin/headeradmin.component';
import { PieadminComponent } from '../../components/pieadmin/pieadmin.component';
import { FichaselecionadaService } from '../../services/session/fichaselecionada.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [HeaderadminComponent, PieadminComponent, RouterOutlet, RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  pendientes = 0;

  constructor(private fichaSrv: FichaselecionadaService) {}

  ngOnInit(): void {
    this.fichaSrv.getFichasPendientes$().subscribe(n => this.pendientes = n);
  }
}
