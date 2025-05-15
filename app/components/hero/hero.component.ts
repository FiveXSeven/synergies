import { Component } from "@angular/core";
import { AboutComponent } from "../about/about.component";
import { TechniquesAgroecoComponent } from "../techniques-agroeco/techniques-agroeco.component";
import { FooterComponent } from "../footer/footer.component";

@Component({
    selector: "app-hero",
    imports: [AboutComponent, TechniquesAgroecoComponent, FooterComponent],
    templateUrl: "./hero.component.html",
    styleUrl: "./hero.component.scss",
})
export class HeroComponent {}
