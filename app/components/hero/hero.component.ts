import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AboutComponent } from "../about/about.component";
import { RecentPostsComponent } from "../recent-posts/recent-posts.component";
import { FooterComponent } from "../footer/footer.component";

@Component({
    selector: "app-hero",
    standalone: true,
    imports: [
        RouterLink,
        AboutComponent, 
        RecentPostsComponent,
        FooterComponent
    ],
    templateUrl: "./hero.component.html",
    styleUrl: "./hero.component.scss",
})
export class HeroComponent {}
