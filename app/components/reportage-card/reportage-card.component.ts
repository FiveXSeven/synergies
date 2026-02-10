import { Component, Input } from '@angular/core';
import { Publication } from '../../models/publication.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reportage-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reportage-card.component.html',
  styleUrl: './reportage-card.component.scss'
})
export class ReportageCardComponent {
  @Input() publication!: Publication;

  getImageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `http://localhost:3000${path}`;
  }
}
