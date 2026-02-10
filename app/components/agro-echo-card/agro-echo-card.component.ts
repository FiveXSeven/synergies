import { Component, Input, inject } from '@angular/core';
import { Publication } from '../../models/publication.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicationService } from '../../services/publication.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-agro-echo-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './agro-echo-card.component.html',
  styleUrl: './agro-echo-card.component.scss'
})
export class AgroEchoCardComponent {
  @Input() publication!: Publication;
  private pubService = inject(PublicationService);

  getImageUrl(path: string): string {
    return this.pubService.getImageUrl(path);
  }
}
