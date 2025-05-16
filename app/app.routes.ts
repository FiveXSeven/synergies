import { Routes } from "@angular/router";
import { HeroComponent } from "./components/hero/hero.component";
import { ReportagePageComponent } from "./pages/reportage-page/reportage-page.component";
import { AgroEchoPagesComponent } from "./pages/agro-echo-pages/agro-echo-pages.component";
import { ContactComponent } from "./components/contact/contact.component";

export const routes: Routes = [
    {
        path: "",
        component: HeroComponent,
    },
    {
        path: "reportages",
        component: ReportagePageComponent,
    },
    {
        path: "agro-echos",
        component: AgroEchoPagesComponent,
    },
    {
        path: "contact",
        component: ContactComponent,
    },
];
