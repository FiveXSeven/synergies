import { Component, Input } from "@angular/core";

@Component({
    selector: "app-header-page",
    standalone: true,
    imports: [],
    templateUrl: "./header-page.component.html",
    styleUrl: "./header-page.component.scss",
})
export class HeaderPageComponent {
    @Input() title: string = "";
    @Input() subtitle: string = "";
}
