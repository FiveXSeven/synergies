import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  isMenuOpen = false;
  activeLink = 'Accueil';

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  setActive(linkName: string): void {
    this.activeLink = linkName;
    this.isMenuOpen = false; // Ferme le menu mobile après sélection
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const menu = document.getElementById('main-menu');
    const toggle = document.getElementById('menu-toggle');

    if (
      this.isMenuOpen &&
      !menu?.contains(target) &&
      !toggle?.contains(target)
    ) {
      this.isMenuOpen = false;
    }
  }
}
