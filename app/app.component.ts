import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NavbarComponent } from "./components/navbar/navbar.component";
import { HeroComponent } from "./components/hero/hero.component";
import { AboutComponent } from "./components/about/about.component";
import { TechniquesAgroecoComponent } from "./components/techniques-agroeco/techniques-agroeco.component";
import { FooterComponent } from "./components/footer/footer.component";
import { BackToTopComponent } from "./components/back-to-top/back-to-top.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        RouterOutlet,
        NavbarComponent,
        HeroComponent,
        AboutComponent,
        TechniquesAgroecoComponent,
        FooterComponent,
        BackToTopComponent,
    ],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent {}
