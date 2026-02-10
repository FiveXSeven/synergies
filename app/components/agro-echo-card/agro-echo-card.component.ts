import { Component, Input } from '@angular/core';
import { Publication } from '../../models/publication.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agro-echo-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './agro-echo-card.component.html',
  styleUrl: './agro-echo-card.component.scss'
})
export class AgroEchoCardComponent {
  @Input() publication!: Publication;

  getImageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `http://localhost:3000${path}`;
  }
}
