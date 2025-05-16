import { Component } from '@angular/core';
import { AgroEchoCardComponent } from '../../components/agro-echo-card/agro-echo-card.component';
import { HeaderPageComponent } from '../../components/header-page/header-page.component';

@Component({
  selector: 'app-agro-echo-pages',
  imports: [AgroEchoCardComponent, HeaderPageComponent],
  templateUrl: './agro-echo-pages.component.html',
  styleUrl: './agro-echo-pages.component.scss'
})
export class AgroEchoPagesComponent {

}
