import { Component } from '@angular/core';
import { HeaderadminComponent} from '../../components/headeradmin/headeradmin.component';
import { PieadminComponent} from '../../components/pieadmin/pieadmin.component';
@Component({
  selector: 'app-home',
  imports: [HeaderadminComponent, PieadminComponent ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
