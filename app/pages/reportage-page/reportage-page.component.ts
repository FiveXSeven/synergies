import { Component } from "@angular/core";
import { ReportageCardComponent } from "../../components/reportage-card/reportage-card.component";
import { HeaderPageComponent } from "../../components/header-page/header-page.component";

@Component({
    selector: "app-reportage-page",
    imports: [ReportageCardComponent, HeaderPageComponent],
    templateUrl: "./reportage-page.component.html",
    styleUrl: "./reportage-page.component.scss",
})
export class ReportagePageComponent {}
